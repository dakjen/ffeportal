// src/app/api/admin/quotes/[quoteId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotes, quoteItems, users, requests, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// Reuse schema from POST route, adjust as necessary for PUT (e.g., quoteId is implicit)
const quoteItemSchema = z.object({
  id: z.string().optional(), // Items might have IDs if they are existing
  serviceName: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0), // Line total
  unitPrice: z.coerce.number().min(0), // Unit price
  quantity: z.coerce.number().min(0), // Quantity
});

const updateQuoteSchema = z.object({
  requestId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().nullable().optional(), // Allow nullable and optional for drafts
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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

    if (!quote) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));

    // Fetch client and request details if available
    let client = null;
    if (quote.clientId) {
        [client] = await db.select().from(users).where(eq(users.id, quote.clientId));
        console.log('Fetched Client Object:', client); // Added for debugging
    }

    let request = null;
    if (quote.requestId) {
        [request] = await db.select().from(requests).where(eq(requests.id, quote.requestId));
    }

    return NextResponse.json({
      quote: {
        ...quote,
        quoteItems: items,
        client: client || null,
        request: request || null,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching quote by ID:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
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
        } = updateQuoteSchema.parse(body);

        const result = await db.transaction(async (tx) => {
            // First, fetch the existing quote to ensure it exists
            const [existingQuote] = await tx.select().from(quotes).where(eq(quotes.id, quoteId));
            if (!existingQuote) {
                throw new Error('Quote not found');
            }

            let finalClientId: string | null = null;
            let finalProjectName: string;
            let client: typeof users.$inferSelect | undefined;

            // Logic to resolve Client and Project Name (similar to POST, but for existing)
            // If requestId is present in the update, prioritize it
            if (requestId) {
                const [request] = await tx.select().from(requests).where(eq(requests.id, requestId));
                if (!request) {
                    throw new Error('Request not found');
                }
                finalClientId = request.clientId;
                finalProjectName = request.projectName;
            } else {
                // If no requestId in payload, use clientId from payload or existing quote's clientId
                if (status !== 'draft' && !clientId && !existingQuote.clientId) {
                    throw new Error('Client ID is required for standalone quotes (unless it is a draft) and no existing client ID found.');
                }
                finalClientId = clientId || existingQuote.clientId || null;
                finalProjectName = projectName || existingQuote.projectName || 'Untitled Quote';
            }

            // Fetch Client Details (only if finalClientId is available)
            if (finalClientId) {
                [client] = await tx.select().from(users).where(eq(users.id, finalClientId));
                if (!client) throw new Error('Client not found with ID: ' + finalClientId);
            } else if (status !== 'draft') {
                throw new Error('Client ID is required for standalone quotes (non-draft)');
            }

            // 1. Update the existing quote
            const [updatedQuote] = await tx.update(quotes)
                .set({
                    // requestId should generally not change for an existing quote if it's already set
                    // clientId can change if reassigned for standalone quotes
                    clientId: finalClientId,
                    projectName: finalProjectName,
                    notes: notes || null,
                    netPrice: netPrice.toFixed(2),
                    taxRate: taxRate.toFixed(4),
                    taxAmount: taxAmount.toFixed(2),
                    deliveryFee: deliveryFee.toFixed(2),
                    totalPrice: totalPrice.toFixed(2),
                    status: status,

                })
                .where(eq(quotes.id, quoteId))
                .returning();

            if (!updatedQuote) {
                throw new Error('Failed to update quote');
            }

            // 2. Delete existing quote items and insert new ones
            await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

            const itemsToInsert = newQuoteItems.map(item => ({
                quoteId: updatedQuote.id,
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
            if (status === 'sent' && updatedQuote.requestId) {
                await tx.update(requests)
                    .set({ status: 'quoted' })
                    .where(eq(requests.id, updatedQuote.requestId));
            }

            // 4. Send Email & Notifications (if status changed to sent and client exists)
            if (status === 'sent' && existingQuote.status !== 'sent' && client) {
                const baseUrl = process.env.NEXT_PUBLIC_CLIENT_PORTAL_BASE_URL;
                const quoteLink = updatedQuote.requestId
                    ? `${baseUrl}/client/requests/${updatedQuote.requestId}`
                    : `${baseUrl}/client/quotes/${updatedQuote.id}`;

                const currentYear = new Date().getFullYear();

                const dynamicTemplateData = {
                    first_name: client.name.split(' ')[0],
                    quote_link: quoteLink,
                    company_phone: '443-641-4853',
                    company_email: process.env.SENDGRID_FROM_EMAIL,
                    current_year: currentYear,
                    project_name: finalProjectName,
                    quote_id: updatedQuote.id,
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
                    console.log(`Email notification sent to ${client.email} for quote ${updatedQuote.id}.`);
                } catch (emailError: any) {
                    console.error(`Failed to send email notification:`, emailError.message);
                }

                // In-app notification
                try {
                    await tx.insert(notifications).values({
                        userId: client.id,
                        message: `Your quote for project "${finalProjectName}" has been updated.`,
                        link: quoteLink,
                        isRead: false,
                    });
                } catch (notificationError) {
                    console.error(`Failed to create in-app notification:`, notificationError);
                }
            }

            return updatedQuote;
        });

        return NextResponse.json({ message: 'Quote updated successfully', quote: result }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
        }
        console.error('Update quote error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


export async function DELETE(
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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch the quote to check its status
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));

    if (!quote) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    // Delete quote items first (if ondelete: 'cascade' is not set on quoteItems relation)
    // Check schema: quoteItems.quoteId references quotes.id with onDelete: 'cascade'
    // Delete associated quote items first
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    const [deletedQuote] = await db.delete(quotes)
      .where(eq(quotes.id, quoteId))
      .returning();

    if (!deletedQuote) {
      return NextResponse.json({ message: 'Quote not found or not deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quote deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Delete quote error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}