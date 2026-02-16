// src/app/api/quotes/[quoteId]/pdf/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems, requests, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { generateQuotePdf, QuoteItem, QuoteDetails, getShortId } from '@/lib/pdf-generator';

export const runtime = 'nodejs'; // Explicitly set to Node.js runtime

export async function GET(
  request: Request,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await context.params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.id;
    const userRole = payload.role;

    // Fetch quote details
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

    if (!quote) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    // Prevent clients from accessing draft quotes
    if (userRole !== 'admin' && quote.status === 'draft') {
      return NextResponse.json({ message: 'Forbidden: This quote is still in draft' }, { status: 403 });
    }

    let requestData: typeof requests.$inferSelect | null = null;
    if (quote.requestId) {
      const [fetchedRequest] = await db.select().from(requests).where(eq(requests.id, quote.requestId));
      if (!fetchedRequest) {
        return NextResponse.json({ message: 'Linked request not found' }, { status: 404 });
      }
      requestData = fetchedRequest;
    }

    let clientData: typeof users.$inferSelect | null = null;
    if (requestData && requestData.clientId) {
      const [fetchedClient] = await db.select().from(users).where(eq(users.id, requestData.clientId));
      if (!fetchedClient) {
        return NextResponse.json({ message: 'Client not found for linked request' }, { status: 404 });
      }
      clientData = fetchedClient;
    } else if (quote.clientId) {
      const [fetchedClient] = await db.select().from(users).where(eq(users.id, quote.clientId));
      if (!fetchedClient) {
        return NextResponse.json({ message: 'Client not found for standalone quote' }, { status: 404 });
      }
      clientData = fetchedClient;
    }

    // Authorization check: Only admin or the client who owns the quote can download
    if (userRole !== 'admin' && (!clientData || userId !== clientData.id)) {
      return NextResponse.json({ message: 'Forbidden: You do not have access to this quote' }, { status: 403 });
    }

    // Fetch quote items
    const quoteItemsData = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    // Prepare data for PDF generation, matching the QuoteDetails interface
    const quoteDetails: QuoteDetails = {
      id: quote.id,
      projectName: requestData?.projectName || quote.projectName || 'Unnamed Project',
      clientName: clientData?.name || 'Unknown Client',
      clientCompanyName: clientData?.companyName || undefined,
      clientEmail: clientData?.email || undefined, // Added clientEmail
      logoPath: '/icon.png', // Placeholder for now, replace with actual logo path
      netPrice: parseFloat(quote.netPrice),
      taxRate: parseFloat(quote.taxRate || '0'),
      taxAmount: parseFloat(quote.taxAmount || '0'),
      deliveryFee: parseFloat(quote.deliveryFee || '0'),
      totalPrice: parseFloat(quote.totalPrice),
      sentAt: quote.createdAt instanceof Date ? quote.createdAt : new Date(quote.createdAt),
      paymentTerms: "A 35% or more deposit may be required to initiate procurement. Remaining balance is due prior to delivery. This quote is valid for 14 days.",

      items: quoteItemsData.map(item => ({
        serviceName: item.serviceName,
        description: item.description || undefined, // Convert null to undefined for QuoteItem
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice || '0'), // Convert null to '0' then parse
        price: parseFloat(item.price),
      })),
    };

    // Generate PDF
    const pdfBuffer = await generateQuotePdf(quoteDetails);

    const formattedDate = new Date(quote.createdAt).toISOString().split('T')[0];
    const shortQuoteId = quote.id.substring(0, 6);
    const filename = `DesignDomainLLC-Quote-${formattedDate}-${shortQuoteId}.pdf`;

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), { // Wrap Buffer in Uint8Array
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF for quote:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}