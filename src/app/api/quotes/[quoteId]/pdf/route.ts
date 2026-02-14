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
  { params }: { params: { quoteId: string } }
) {
  try {
    const { quoteId } = params;

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

    // Fetch associated request and client details
    const [request] = await db.select().from(requests).where(eq(requests.id, quote.requestId));
    if (!request) {
      return NextResponse.json({ message: 'Request not found for quote' }, { status: 404 });
    }

    const [client] = await db.select().from(users).where(eq(users.id, request.clientId));
    if (!client) {
      return NextResponse.json({ message: 'Client not found for request' }, { status: 404 });
    }

    // Authorization check: Only admin or the client who owns the quote can download
    if (userRole !== 'admin' && userId !== client.id) {
      return NextResponse.json({ message: 'Forbidden: You do not have access to this quote' }, { status: 403 });
    }

    // Fetch quote items
    const quoteItemsData = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    // Prepare data for PDF generation
    const quoteDetails = {
      id: quote.id,
      totalPrice: parseFloat(quote.totalPrice), // Ensure number type
      status: quote.status,
      projectName: request.projectName,
      clientName: client.name,
      clientCompanyName: client.companyName || undefined,
      items: quoteItemsData.map(item => ({
        serviceName: item.serviceName,
        description: item.description || undefined,
        price: parseFloat(item.price), // Ensure number type
        unitPrice: parseFloat(item.unitPrice), // Ensure number type
        quantity: parseFloat(item.quantity), // Ensure number type
      })),
    };

    // Generate PDF
    const pdfBuffer = await generateQuotePdf(quoteDetails);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
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
