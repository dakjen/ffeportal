// src/app/api/admin/requests/[requestId]/quote/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = await params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch the quote associated with this requestId
    // An admin can only have one quote per request, so we take the first one
    const [quote] = await db.select().from(quotes).where(eq(quotes.requestId, requestId));

    if (!quote) {
      return NextResponse.json({ message: 'Quote not found for this request' }, { status: 404 });
    }

    // Fetch its quote items
    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));

    return NextResponse.json({
      quote: {
        ...quote,
        quoteItems: items,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching quote by request ID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
