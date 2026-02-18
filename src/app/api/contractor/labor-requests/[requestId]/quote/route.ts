import { NextResponse } from 'next/server';
import { db } from '@/db';
import { laborRequests, laborRequestItems, notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const itemSchema = z.object({
  serviceName: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().min(0.1),
  total: z.number().min(0),
});

const submitEstimateSchema = z.object({
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  subtotal: z.number().min(0),
  discount: z.number().optional(),
  depositRequired: z.boolean(),
  depositPercentage: z.number().optional(),
  total: z.number().min(0),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await context.params;
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let userPayload;
    try {
      userPayload = await verifyToken(token);
      if (userPayload.role !== 'contractor') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = submitEstimateSchema.parse(body);

    // 1. Fetch the request to verify ownership
    const [existingRequest] = await db.select()
      .from(laborRequests)
      .where(and(eq(laborRequests.id, requestId), eq(laborRequests.contractorId, userPayload.id)));

    if (!existingRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Use a transaction
    await db.transaction(async (tx) => {
      // 2. Update the labor request
      await tx.update(laborRequests)
        .set({
          quotePrice: data.total.toString(),
          subtotal: data.subtotal.toString(),
          discount: data.discount ? data.discount.toString() : '0',
          depositRequired: data.depositRequired,
          depositPercentage: data.depositPercentage ? data.depositPercentage.toString() : '0',
          contractorNotes: data.notes,
          status: 'quoted',
          updatedAt: new Date(),
        })
        .where(eq(laborRequests.id, requestId));

      // 3. Clear old items (if re-submitting) and insert new ones
      await tx.delete(laborRequestItems).where(eq(laborRequestItems.laborRequestId, requestId));

      if (data.items.length > 0) {
        await tx.insert(laborRequestItems).values(
          data.items.map(item => ({
            laborRequestId: requestId,
            serviceName: item.serviceName,
            description: item.description,
            price: item.price.toString(),
            quantity: item.quantity.toString(),
            total: item.total.toString(),
          }))
        );
      }

      // 4. Notify the admin
      await tx.insert(notifications).values({
        userId: existingRequest.adminId,
        message: `Estimate received ($${data.total.toFixed(2)}) for request ${requestId.slice(0, 8)}...`,
        link: '/admin/labor-requests',
        createdAt: new Date(),
      });
    });

    return NextResponse.json({ message: 'Estimate submitted successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Failed to submit estimate:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}