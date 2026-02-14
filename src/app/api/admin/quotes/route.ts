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
  requestId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().nullable().optional(),
  projectName: z.string().optional(),
  notes: z.string().optional(),
  quoteItems: z.array(quoteItemSchema),
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
    // Convert empty string clientId to null for nullable Zod schema
    if (body.clientId === '') {
      body.clientId = null;
    }
    const {
      requestId,
      clientId,
      projectName,
      notes,
      quoteItems: newQuoteItems,
      netPrice,
      taxRate,
      taxAmount,
      deliveryFee,
      totalPrice,
      status
    } = saveQuoteSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      let finalClientId: string | null = null;
      let finalProjectName: string;
      let client: typeof users.$inferSelect | undefined;

      // Logic to resolve Client and Project Name
      if (requestId) {
        // Case A: Quote linked to a Request
        const [request] = await tx.select()
          .from(requests)
          .where(eq(requests.id, requestId));

        if (!request) {
          throw new Error('Request not found');
        }
        finalClientId = request.clientId;
        finalProjectName = request.projectName;
      } else {
        // Case B: Standalone Quote
        if (status !== 'draft' && !clientId) {
          throw new Error('Client ID is required for standalone quotes (unless it is a draft)');
        }
        finalClientId = clientId || null;
        finalProjectName = projectName || 'Untitled Quote';
      }

      // Fetch Client Details (only if finalClientId is available)
      if (finalClientId) {
        [client] = await tx.select().from(users).where(eq(users.id, finalClientId));
        if (!client) throw new Error('Client not found with ID: ' + finalClientId);
      } else if (status !== 'draft') {
        throw new Error('Client ID is required for standalone quotes (non-draft)');
      }


      // 1. Insert the new quote
      const [newQuote] = await tx.insert(quotes).values({
        requestId: requestId || null,
        clientId: finalClientId,
        projectName: finalProjectName,
        notes: notes || null,
        netPrice: netPrice.toFixed(2),
        taxRate: taxRate.toFixed(4), 
        taxAmount: taxAmount.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        status,
      }).returning();

      if (!newQuote) {
        throw new Error('Failed to create quote');
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

      // 3. Update request status if linked and sent
      if (status === 'sent' && requestId) {
        await tx.update(requests)
          .set({ status: 'quoted' })
          .where(eq(requests.id, requestId));
      }

      // 4. Send Email & Notifications (if sent)
      if (status === 'sent') {
        
        // Construct link (Request-based or Quote-based view)
        // Ideally, client portal should support /client/quotes/[quoteId] for standalone
        // For now, if requestId exists, use that. If not, use quoteId (assuming you'll build that page)
        const baseUrl = process.env.NEXT_PUBLIC_CLIENT_PORTAL_BASE_URL;
        const quoteLink = requestId 
            ? `${baseUrl}/client/requests/${requestId}` 
            : `${baseUrl}/client/quotes/${newQuote.id}`;

        const currentYear = new Date().getFullYear();

        const dynamicTemplateData = {
          first_name: client.name.split(' ')[0], 
          quote_link: quoteLink,
          company_phone: '443-641-4853', 
          company_email: process.env.SENDGRID_FROM_EMAIL,
          current_year: currentYear,
          project_name: finalProjectName,
          quote_id: newQuote.id,
          total_price: totalPrice.toFixed(2),
        };

        try {
          const msg = {
            to: client.email,
            from: process.env.SENDGRID_FROM_EMAIL as string,
            templateId: 'd-c0b8c78eb6e1417bad4397ae4c7f6b4f', 
            dynamicTemplateData: dynamicTemplateData,
          };
          await sgMail.send(msg);
          console.log(`Email notification sent to ${client.email} for quote ${newQuote.id}.`);
        } catch (emailError: any) {
          console.error(`Failed to send email notification:`, emailError.message);
        }

        // In-app notification
        try {
          await tx.insert(notifications).values({
            userId: client.id,
            message: `A new quote has been sent for your project "${finalProjectName}".`,
            link: quoteLink,
            isRead: false,
          });
        } catch (notificationError) {
          console.error(`Failed to create in-app notification:`, notificationError);
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