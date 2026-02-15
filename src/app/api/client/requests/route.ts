import { NextResponse } from 'next/server';
import { db } from '@/db';
import { requests } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

const newRequestSchema = z.object({
  projectId: z.string().uuid('Project ID is required'),
  projectName: z.string().min(1, 'Project Name is required'),
  description: z.string().min(1, 'Description is required'),
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { projectId, projectName, description } = newRequestSchema.parse(body);

    const newRequest = await db.insert(requests).values({
      clientId: payload.id, // Client ID from the authenticated user
      projectId,
      projectName,
      description,
      status: 'pending', // Initial status
    }).returning();

    return NextResponse.json({ message: 'Request submitted successfully', request: newRequest[0] }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Submit request error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
