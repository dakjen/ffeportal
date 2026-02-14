// src/app/api/admin/quotes/[quoteId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems, users, requests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(
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

    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

    if (!quote) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));

    // Fetch client and request details if available
    let client = null;
    if (quote.clientId) {
        [client] = await db.select().from(users).where(eq(users.id, quote.clientId));
    }

    let request = null;
    if (quote.requestId) {
        [request] = await db.select().from(requests).where(eq(requests.id, quote.requestId));
    }

    return NextResponse.json({
      quote: {
        ...quote,
        quoteItems: items,
        client: client || null,
        request: request || null,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching quote by ID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

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
