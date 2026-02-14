// src/app/api/quotes/[quoteId]/pdf/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems, requests, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { generateQuotePdf } from '@/lib/pdf-generator';

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

    let requestData = null;
    if (quote.requestId) {
      const [fetchedRequest] = await db.select().from(requests).where(eq(requests.id, quote.requestId));
      if (!fetchedRequest) {
        return NextResponse.json({ message: 'Linked request not found' }, { status: 404 });
      }
      requestData = fetchedRequest;
    }

    let clientData = null;
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
    // This now relies on clientData possibly being null if it's a quote not linked to any client directly.
    if (userRole !== 'admin' && (!clientData || userId !== clientData.id)) {
      return NextResponse.json({ message: 'Forbidden: You do not have access to this quote' }, { status: 403 });
    }

    // Fetch quote items
    const quoteItemsData = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    // Prepare data for PDF generation
    const quoteDetails = {
      id: quote.id,
      totalPrice: parseFloat(quote.totalPrice || '0'), // Ensure number type
      netPrice: parseFloat(quote.netPrice || '0'),
      taxRate: parseFloat(quote.taxRate || '0'),
      taxAmount: parseFloat(quote.taxAmount || '0'),
      deliveryFee: parseFloat(quote.deliveryFee || '0'),
      status: quote.status,
      projectName: requestData?.projectName || quote.projectName || 'Untitled Project',
      clientName: clientData?.name || 'N/A',
      clientCompanyName: clientData?.companyName || undefined,
      items: quoteItemsData.map(item => ({
        serviceName: item.serviceName,
        description: item.description || undefined,
        price: parseFloat(item.price), // Ensure number type
        unitPrice: parseFloat(item.unitPrice || '0'), // Ensure number type
        quantity: parseFloat(item.quantity), // Ensure number type
      })),
    };

    // Generate PDF
    const pdfBuffer = await generateQuotePdf(quoteDetails);

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quoteId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF for quote:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
