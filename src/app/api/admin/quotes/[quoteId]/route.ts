// src/app/api/admin/quotes/[quoteId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { quoteId } = await params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch the quote to check its status
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

    if (!quote) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    // Only allow deletion if the quote has not been sent
    if (quote.status === 'sent') {
      return NextResponse.json({ message: 'Sent quotes cannot be deleted directly.' }, { status: 403 });
    }

    // Delete quote items first (if ondelete: 'cascade' is not set on quoteItems relation)
    // Check schema: quoteItems.quoteId references quotes.id with onDelete: 'cascade'
    // So deleting the quote will automatically delete its items. No explicit deletion here needed.

    const [deletedQuote] = await db.delete(quotes)
      .where(eq(quotes.id, quoteId))
      .returning();

    if (!deletedQuote) {
      return NextResponse.json({ message: 'Quote not found or not deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quote deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Delete quote error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
