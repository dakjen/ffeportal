import { NextResponse } from 'next/server';
import { db } from '@/db';
import { laborRequests, notifications } from '@/db/schema';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';
import { z } from 'zod';

const createLaborRequestSchema = z.object({
  contractorId: z.string().uuid('Invalid contractor ID'),
  requestId: z.string().uuid('Invalid request ID'),
  message: z.string().min(1, 'Message is required'),
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
      return NextResponse.json({ message: 'Forbidden: Only admins can create labor requests' }, { status: 403 });
    }

    const body = await req.json();
    const { contractorId, requestId, message } = createLaborRequestSchema.parse(body);

    await db.insert(laborRequests).values({
      adminId: userPayload.id,
      contractorId,
      requestId,
      message,
    });

    // Create notification for the contractor
    await db.insert(notifications).values({
      userId: contractorId,
      message: 'New quote request received',
      link: '/contractor/labor-requests',
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Labor request created successfully' }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Failed to create labor request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
