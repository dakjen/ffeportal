import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const updateInvoiceSchema = z.object({
  status: z.enum(['pending', 'approved', 'paid', 'rejected']),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { status } = updateInvoiceSchema.parse(body);

    await db.update(invoices)
      .set({ status })
      .where(eq(invoices.id, params.id));

    return NextResponse.json({ message: 'Invoice updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
