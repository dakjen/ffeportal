import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, notifications, users, requests } from '@/db/schema'; // Added requests to schema import
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth'; // Changed from auth-edge

export async function POST(
  req: Request,
  context: any // Temporarily set to any to allow Next.js to infer or pass its own type
) {
  try {
    const { quoteId } = context.params;
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can approve quotes' }, { status: 403 });
    }

    // 1. Fetch the quote
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
    if (!quote) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    // Authorize: Ensure the client owns this quote
    if (quote.clientId !== payload.id) {
      return NextResponse.json({ message: 'Forbidden: You do not own this quote' }, { status: 403 });
    }

    // Check if quote is in a state that can be approved
    if (quote.status !== 'sent' && quote.status !== 'revised') {
      return NextResponse.json({ message: `Quote cannot be approved in '${quote.status}' status` }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      // 2. Update quote status to 'approved'
      await tx.update(quotes)
        .set({ status: 'approved' })
        .where(eq(quotes.id, quoteId));

      // 3. Notify relevant admin(s)
      // This assumes the admin who created the quote needs to be notified.
      // We need to fetch the request to find the admin associated with it.
      // For now, let's assume there's a direct adminId on quotes or figure out the relation.
      // If quote is linked to a request, and request has a client, the client might have an admin parent.
      // Or, the quote itself is created by an admin for a client.
      // Let's assume the admin responsible for the *request* is the one to notify.
      // This is a simplification and might need adjustment based on how quotes are assigned to admins.
      
      // For now, let's just create a notification for the client themselves for demo purposes
      // or find the associated admin for the request that generated this quote.

      if (quote.requestId) {
        const [relatedRequest] = await tx.select().from(requests).where(eq(requests.id, quote.requestId));
        if (relatedRequest) {
            // Find the admin whose client_id matches the request's client_id for this quote
            // This is still a bit indirect. A better approach might be to have adminId directly on the quote.
            // For now, let's assume the 'client' in quotes table is the one whose admin created it.
            // If the admin created this quote for this client, then the admin's ID is what we need.
            // This information is not directly available on the quote or request easily.
            // Let's assume the first admin who sent this quote should be notified.

            // This is a placeholder. A more robust notification system would be needed.
            // For now, just a generic notification for the client.
            await tx.insert(notifications).values({
                userId: payload.id, // Client User ID
                message: `Your quote for project "${quote.projectName}" has been approved!`,
                link: `/client/requests/${quote.requestId}`,
                isRead: false,
            });

            // Also, notify the admin who created the quote.
            // This requires knowing which admin created this specific quote.
            // Let's assume the quote has an admin_id on it for a direct link.
            // The quote currently has clientId, requestId, projectName, etc. but no adminId.
            // This implies the admin who CREATED the quote needs to be passed in.

            // For the sake of progress, I will make an assumption that the admin associated with the *request* is the one to notify.
            // This needs to be clarified by the user.
            // For now, I will create a dummy notification for admin as well.
            const adminIdToNotify = 'admin-placeholder-id'; // This needs to be dynamically fetched.

            // This part requires knowing who the admin is that sent this specific quote.
            // This information is not stored in quotes.
            // I will defer this to the user to decide how they want to track who sent the quote.
            // For now, let's just notify the client and log a message.

            console.log(`Quote ${quoteId} for project ${quote.projectName} approved by client ${payload.id}. Admin notification logic needs to be implemented.`);
        }
      }

    });

    return NextResponse.json({ message: 'Quote approved successfully' }, { status: 200 });

  } catch (error) {
    console.error('Approve quote error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
