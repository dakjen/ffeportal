import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { requests, documents, quotes, quoteItems, comments, notifications, contractorRequests, laborRequests, laborRequestItems, invoices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { requestId } = resolvedParams;

    // Check if the request exists
    const [requestToDelete] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, requestId));

    if (!requestToDelete) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Perform deletion in a transaction to ensure referential integrity
    // This is more complex for admins because we need to delete quotes, invoices, labor requests, etc.
    await db.transaction(async (tx) => {
      
      // 1. Get associated quotes
      const relatedQuotes = await tx.select({ id: quotes.id }).from(quotes).where(eq(quotes.requestId, requestId));
      const quoteIds = relatedQuotes.map(q => q.id);

      // 2. Delete Quote Items & Comments for each quote
      for (const qId of quoteIds) {
        await tx.delete(quoteItems).where(eq(quoteItems.quoteId, qId));
        await tx.delete(comments).where(eq(comments.quoteId, qId));
      }

      // 3. Delete Quotes
      await tx.delete(quotes).where(eq(quotes.requestId, requestId));

      // 4. Delete Invoices linked to this request
      await tx.delete(invoices).where(eq(invoices.requestId, requestId));

      // 5. Delete Labor Requests & Items linked to this request
      const relatedLaborRequests = await tx.select({ id: laborRequests.id }).from(laborRequests).where(eq(laborRequests.requestId, requestId));
      for (const lr of relatedLaborRequests) {
          await tx.delete(laborRequestItems).where(eq(laborRequestItems.laborRequestId, lr.id));
      }
      await tx.delete(laborRequests).where(eq(laborRequests.requestId, requestId));

      // 6. Delete Documents
      await tx.delete(documents).where(eq(documents.requestId, requestId));
      
      // 7. Delete the request itself
      await tx.delete(requests).where(eq(requests.id, requestId));
    });

    return NextResponse.json({ message: 'Request and all associated data deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin delete request error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}