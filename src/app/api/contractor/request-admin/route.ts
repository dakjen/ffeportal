import { NextResponse } from 'next/server';
import { db } from '@/db';
import { contractorRequests, users } from '@/db/schema';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const requestAdminSchema = z.object({
  adminId: z.string().uuid('Invalid admin ID'),
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

    if (userPayload.role !== 'contractor') {
      return NextResponse.json({ message: 'Forbidden: Only contractors can send requests' }, { status: 403 });
    }

    const body = await req.json();
    const { adminId } = requestAdminSchema.parse(body);

    // Verify admin exists and is an admin
    const [admin] = await db.select().from(users).where(eq(users.id, adminId));
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    // Check if request already exists
    const [existingRequest] = await db.select()
      .from(contractorRequests)
      .where(and(
        eq(contractorRequests.clientId, userPayload.id),
        eq(contractorRequests.adminId, adminId)
      ));

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
         return NextResponse.json({ message: 'Request already pending' }, { status: 400 });
      } else if (existingRequest.status === 'approved') {
         return NextResponse.json({ message: 'You are already connected with this admin' }, { status: 400 });
      } else {
         // Re-open rejected request? Or create new? Let's just update status to pending.
         await db.update(contractorRequests)
            .set({ status: 'pending', updatedAt: new Date() })
            .where(eq(contractorRequests.id, existingRequest.id));
         return NextResponse.json({ message: 'Request re-sent successfully' }, { status: 200 });
      }
    }

    // Create new request
    await db.insert(contractorRequests).values({
      clientId: userPayload.id,
      adminId,
      status: 'pending',
    });

    return NextResponse.json({ message: 'Request sent successfully' }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Failed to request admin:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
