import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const allInvoices = await db.select({
      id: invoices.id,
      projectName: invoices.projectName,
      description: invoices.description,
      amount: invoices.amount,
      status: invoices.status,
      createdAt: invoices.createdAt,
      contractorName: users.name,
    })
    .from(invoices)
    .leftJoin(users, eq(invoices.contractorId, users.id))
    .orderBy(desc(invoices.createdAt));

    return NextResponse.json({ invoices: allInvoices }, { status: 200 });
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
