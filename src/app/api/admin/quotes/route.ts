import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems, requests, users, notifications } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const quoteItemSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0), // Line total
  unitPrice: z.coerce.number().min(0), // Unit price
  quantity: z.coerce.number().min(0), // Quantity
});

const saveQuoteSchema = z.object({
  requestId: z.string().uuid(),
  quoteItems: z.array(quoteItemSchema).min(1, 'Quote must have at least one item'),
  netPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0),
  taxAmount: z.coerce.number().min(0),
  deliveryFee: z.coerce.number().min(0),
  totalPrice: z.coerce.number().min(0),
  status: z.enum(['draft', 'sent', 'approved', 'revised']),
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      requestId,
      quoteItems: newQuoteItems,
      netPrice,
      taxRate,
      taxAmount,
      deliveryFee,
      totalPrice,
      status
    } = saveQuoteSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Insert the new quote
      const [newQuote] = await tx.insert(quotes).values({
        requestId,
        netPrice: netPrice.toFixed(2),
        taxRate: taxRate.toFixed(4), // Store with higher precision for percentage
        taxAmount: taxAmount.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        status,
      }).returning();

      if (!newQuote) {
        throw new Error('Failed to create quote');
      }

      // Fetch request and client details
      const [request] = await tx.select()
        .from(requests)
        .where(eq(requests.id, requestId));

      if (!request) {
        throw new Error('Request not found');
      }

      const [client] = await tx.select()
        .from(users)
        .where(eq(users.id, request.clientId)); // Assuming requests table has clientId

      if (!client) {
        throw new Error('Client not found');
      }

      // 2. Insert quote items
      const itemsToInsert = newQuoteItems.map(item => ({
        quoteId: newQuote.id,
        serviceName: item.serviceName,
        description: item.description,
        price: item.price.toFixed(2), // Line Total
        unitPrice: item.unitPrice.toFixed(2), // Unit Price
        quantity: item.quantity.toFixed(2), // Quantity
      }));

      if (itemsToInsert.length > 0) {
        await tx.insert(quoteItems).values(itemsToInsert);
      }

      // 3. Update request status if the quote is "sent"
      if (status === 'sent') {
        await tx.update(requests)
          .set({ status: 'quoted' })
          .where(eq(requests.id, requestId));

        // Attempt to send email notification to client
        // Add to your .env.local file:
        // NEXT_PUBLIC_CLIENT_PORTAL_BASE_URL=http://localhost:3000 (or your production domain)

        // Construct dynamic template data
        const currentYear = new Date().getFullYear();
        // Assuming your client quote viewing page is /client/requests/[requestId]
        // You might need to adjust this URL based on your actual client portal routing
        const quoteLink = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_BASE_URL}/client/requests/${newQuote.requestId}`;

        const dynamicTemplateData = {
          first_name: client.name.split(' ')[0], // Assuming first name
          quote_link: quoteLink,
          company_phone: '443-641-4853', // IMPORTANT: Update with actual company phone in .env.local or hardcode
          company_email: process.env.SENDGRID_FROM_EMAIL, // Assuming company email is the sender email
          current_year: currentYear,
          project_name: request.projectName,
          quote_id: newQuote.id,
          total_price: totalPrice.toFixed(2),
        };

        try {
          const msg = {
            to: client.email,
            from: process.env.SENDGRID_FROM_EMAIL as string,
            templateId: 'd-c0b8c78eb6e1417bad4397ae4c7f6b4f', // YOUR TEMPLATE ID
            dynamicTemplateData: dynamicTemplateData,
          };
          await sgMail.send(msg);
          console.log(`Email notification sent to ${client.email} for quote ${newQuote.id} using template.`);
        } catch (emailError: any) {
          console.error(`Failed to send email notification for quote ${newQuote.id} to ${client.email} using template:`, emailError.response?.body || emailError.message);
          // Log the error but do not rethrow, as quote submission should not fail due to email
        }

        // Create in-app notification for the client
        try {
          // Ensure NEXT_PUBLIC_CLIENT_PORTAL_BASE_URL is set in .env.local
          const portalQuoteLink = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_BASE_URL}/client/requests/${newQuote.requestId}`;
          await tx.insert(notifications).values({
            userId: client.id,
            message: `A new quote has been sent for your project "${request.projectName}".`,
            link: portalQuoteLink,
            isRead: false,
          });
          console.log(`In-app notification created for client ${client.id} for quote ${newQuote.id}`);
        } catch (notificationError) {
          console.error(`Failed to create in-app notification for quote ${newQuote.id} for client ${client.id}:`, notificationError);
          // Log the error but do not rethrow, as quote submission should not fail due to notification
        }
        }
      }

      return newQuote;
    });

    return NextResponse.json({ message: 'Quote saved successfully', quote: result }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    console.error('Save quote error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}