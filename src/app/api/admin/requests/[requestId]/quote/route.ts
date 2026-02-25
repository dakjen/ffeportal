import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge'; // Changed from auth-edge

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await context.params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Find any quote for the given requestId, not just draft ones
    const [quote] = await db.select().from(quotes)
      .where(eq(quotes.requestId, requestId))
      .limit(1); // Assuming only one quote per request or taking the first one

    if (!quote) {
      // No draft quote found for this request, returning null instead of 404 to keep console clean
      return NextResponse.json({ quote: null, message: 'No draft quote found for this request' }, { status: 200 });
    }

    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));

    let client = null;
    if (quote.clientId) {
      [client] = await db.select().from(users).where(eq(users.id, quote.clientId));
    }

    return NextResponse.json({
      quote: {
        ...quote,
        quoteItems: items,
        client: client ? { name: client.name, companyName: client.companyName } : null, // Selectively return client fields
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching draft quote by request ID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}