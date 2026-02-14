import { NextResponse } from 'next/server';
import { db } from '@/db';
import { contractorRequests, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';
import { z } from 'zod';

const approveRejectSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  action: z.enum(['approve', 'reject']),
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let userPayload;
    try {
      userPayload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (userPayload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Only admins can approve/reject contractor requests' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, action } = approveRejectSchema.parse(body);

    const [request] = await db.select().from(contractorRequests).where(eq(contractorRequests.id, requestId));

    if (!request) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (request.adminId !== userPayload.id) {
      return NextResponse.json({ message: 'Forbidden: You can only act on requests sent to you' }, { status: 403 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ message: 'Request is no longer pending' }, { status: 400 });
    }

    if (action === 'approve') {
      await db.transaction(async (tx) => {
        // 1. Update the client's role to 'contractor' and set their parentId to the approving admin
        await tx.update(users)
          .set({
            role: 'contractor',
            parentId: request.adminId,
          })
          .where(eq(users.id, request.clientId));

        // 2. Update the request status to 'approved'
        await tx.update(contractorRequests)
          .set({
            status: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(contractorRequests.id, requestId));
      });
    } else { // action === 'reject'
      await db.update(contractorRequests)
        .set({
          status: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(contractorRequests.id, requestId));
    }

    return NextResponse.json({ message: `Request ${action}ed successfully` }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Failed to approve/reject contractor request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}