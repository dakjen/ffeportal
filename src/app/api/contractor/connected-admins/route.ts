import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, contractorRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'contractor') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // Fetch admins that this contractor is connected to (status='approved')
    const connectedAdmins = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      companyName: users.companyName,
    })
    .from(contractorRequests)
    .leftJoin(users, eq(contractorRequests.adminId, users.id))
    .where(and(
      eq(contractorRequests.clientId, payload.id),
      eq(contractorRequests.status, 'approved')
    ));

    return NextResponse.json(connectedAdmins);
  } catch (error) {
    console.error('Fetch connected admins error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
