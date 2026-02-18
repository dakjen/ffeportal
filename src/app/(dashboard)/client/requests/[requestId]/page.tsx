import { QuoteItem } from '@/types/quote';
import { db } from '@/db';
import { quotes, requests, quoteItems, users, comments } from '@/db/schema'; // Import comments and users
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import ClientQuoteView from './client-quote-view'; // Import the new Client Component

export default async function ClientQuoteViewPage({ params }: { params: Promise<{ requestId: string }> }) {
  const resolvedParams = await params;
  const requestId = resolvedParams.requestId; // No await here
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'client') {
    // Redirect non-clients or unauthenticated users
    redirect('/login');
  }

  const userId = payload.id;

  // Fetch request details
  const [request] = await db.select().from(requests).where(eq(requests.id, requestId));

  if (!request) {
    redirect('/client/current-projects'); // Redirect if request not found
  }

  // Authorize: Only the client who owns the request can view it
  if (request.clientId !== userId) {
    redirect('/client/current-projects'); // Redirect if not authorized
  }

  // Fetch the quote associated with this request
  const [quote] = await db.select().from(quotes).where(eq(quotes.requestId, requestId));

  // Determine if quote content should be shown
  const showQuote = quote && quote.status !== 'draft';

  // Fetch quote items only if quote is shown
  let items: QuoteItem[] = [];
  let quoteComments: any[] = [];

  if (showQuote && quote) {
    items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
    
    quoteComments = await db.select({
      id: comments.id,
      message: comments.message,
      createdAt: comments.createdAt,
      userName: users.name,
      userRole: users.role,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.quoteId, quote.id))
    .orderBy(desc(comments.createdAt));
  }

  return (
    <ClientQuoteView
      request={request}
      quote={quote}
      items={items}
      comments={quoteComments}
      userId={userId}
    />
  );
}
