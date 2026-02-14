import { NextResponse } from 'next/server';
import { db } from '@/db';
import { contractorRequests, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';
import { z } from 'zod';

const contractorRequestSchema = z.object({
  adminId: z.string().uuid('Invalid admin ID'),
  clientId: z.string().uuid('Invalid client ID'),
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

    if (userPayload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can send contractor requests' }, { status: 403 });
    }

    const body = await req.json();
    const { adminId, clientId } = contractorRequestSchema.parse(body);

    if (userPayload.id !== clientId) {
      return NextResponse.json({ message: 'Forbidden: Client ID mismatch' }, { status: 403 });
    }

    // Check if adminId truly belongs to an admin
    const [adminUser] = await db.select().from(users).where(and(eq(users.id, adminId), eq(users.role, 'admin')));
    if (!adminUser) {
      return NextResponse.json({ message: 'Invalid Admin selected' }, { status: 400 });
    }

    // Check for existing pending request
    const [existingRequest] = await db.select()
      .from(contractorRequests)
      .where(
        and(
          eq(contractorRequests.clientId, clientId),
          eq(contractorRequests.adminId, adminId),
          eq(contractorRequests.status, 'pending')
        )
      );

    if (existingRequest) {
      return NextResponse.json({ message: 'Request already pending for this admin' }, { status: 409 });
    }
    
    // Check if client is already linked to an admin as a contractor
    const [alreadyLinked] = await db.select()
      .from(users)
      .where(and(eq(users.id, clientId), eq(users.role, 'contractor'), eq(users.parentId, adminId)));

    if (alreadyLinked) {
      return NextResponse.json({ message: 'You are already linked to this admin as a contractor' }, { status: 409 });
    }


    await db.insert(contractorRequests).values({
      clientId: clientId,
      adminId: adminId,
      status: 'pending',
    });

    // TODO: Optionally send a notification to the admin here

    return NextResponse.json({ message: 'Contractor request sent successfully' }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Failed to send contractor request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}