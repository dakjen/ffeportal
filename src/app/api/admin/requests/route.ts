import { NextResponse } from 'next/server';
import { db } from '@/db';
import { requests } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const createRequestSchema = z.object({
  clientId: z.string().uuid('Invalid Client ID'),
  projectName: z.string().min(1, 'Project Name is required'),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const data = createRequestSchema.parse(body);

    const [newRequest] = await db.insert(requests).values({
      clientId: data.clientId,
      projectName: data.projectName,
      description: data.description || 'Created by Admin',
      status: 'pending',
    }).returning();

    return NextResponse.json({ message: 'Project created successfully', request: newRequest }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    console.error('Admin create request error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
