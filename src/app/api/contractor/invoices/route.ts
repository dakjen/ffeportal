import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

const invoiceSchema = z.object({
  projectName: z.string().min(1, 'Project Name is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  clientId: z.string().nullable().optional(),
  clientEmail: z.string().email('Invalid email').nullable().optional(),
}).refine(data => data.clientId || data.clientEmail, {
  message: "Either select a client or enter an email",
  path: ["clientEmail"],
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'contractor') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const data = invoiceSchema.parse(body);

    const [newInvoice] = await db.insert(invoices).values({
      contractorId: payload.id,
      projectName: data.projectName,
      description: data.description,
      amount: data.amount.toString(),
      status: 'pending',
      clientId: data.clientId || null,
      clientEmail: data.clientEmail || null,
    }).returning();

    return NextResponse.json({ message: 'Invoice submitted successfully', invoice: newInvoice }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Submit invoice error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}