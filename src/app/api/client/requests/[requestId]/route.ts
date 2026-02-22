import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { requests, documents } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { requestId } = resolvedParams;

    // First check if the request exists and is pending, and belongs to the user or their team
    const [requestToDelete] = await db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.id, requestId),
          eq(requests.status, 'pending')
        )
      );

    if (!requestToDelete) {
      return NextResponse.json({ message: 'Request not found or cannot be deleted' }, { status: 404 });
    }

    // Perform deletion in a transaction to ensure referential integrity
    await db.transaction(async (tx) => {
      // 1. Delete associated documents
      await tx.delete(documents).where(eq(documents.requestId, requestId));
      
      // 2. Delete the request itself
      await tx.delete(requests).where(eq(requests.id, requestId));
    });

    return NextResponse.json({ message: 'Request deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
