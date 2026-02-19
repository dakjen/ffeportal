import { QuoteItem } from '@/types/quote';
import { db } from '@/db';
import { quotes, quoteItems, users, comments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import ClientQuoteView from '../../requests/[requestId]/client-quote-view'; // Reuse the view component

export default async function ClientStandaloneQuoteViewPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const resolvedParams = await params;
  const quoteId = resolvedParams.quoteId;
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'client') {
    redirect('/login');
  }

  const userId = payload.id;

  // Fetch the quote directly
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

  if (!quote) {
    redirect('/client/current-projects');
  }

  // Authorize: Only the client who owns the quote can view it
  if (quote.clientId !== userId) {
    redirect('/client/current-projects');
  }

  // Determine if quote content should be shown (it should be if we are here via email link, but safe check)
  const showQuote = quote.status !== 'draft';

  // Fetch quote items
  let items: QuoteItem[] = [];
  let quoteComments: any[] = [];

  if (showQuote) {
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

  // Create a mock request object to satisfy the ClientQuoteView interface
  // Since this is a standalone quote, it doesn't have a parent request.
  // We'll populate it with info from the quote itself.
  const mockRequest = {
    id: 'standalone', // distinct ID to indicate no real request
    projectName: quote.projectName || 'Untitled Project',
    description: quote.notes || 'No description provided.',
    status: 'quoted', // implicit status
    createdAt: quote.createdAt,
    clientId: quote.clientId || userId,
  };

  return (
    <ClientQuoteView
      request={mockRequest}
      quote={quote}
      items={items}
      comments={quoteComments}
      userId={userId}
    />
  );
}
