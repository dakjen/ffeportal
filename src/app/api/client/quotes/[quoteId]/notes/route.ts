import { NextResponse } from 'next/server';
import { db } from '@/db';
import { comments } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

const addNotesSchema = z.object({
  message: z.string().min(1, 'Notes cannot be empty'),
});

export async function POST(req: Request, context: any) {
  try {
    const { quoteId } = context.params;
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can add notes to quotes' }, { status: 403 });
    }

    const body = await req.json();
    const { message } = addNotesSchema.parse(body);

    await db.insert(comments).values({
      quoteId: quoteId,
      userId: payload.id, // Client's ID
      message: message,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Notes added successfully' }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Add notes error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
