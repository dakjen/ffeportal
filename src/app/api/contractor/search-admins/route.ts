import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { like, or, ilike, and, eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
      await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) return NextResponse.json([]);

    const results = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      companyName: users.companyName,
    })
    .from(users)
    .where(and(
      eq(users.role, 'admin'),
      or(
        ilike(users.name, `%${query}%`),
        ilike(users.email, `%${query}%`),
        ilike(users.companyName, `%${query}%`)
      )
    ))
    .limit(5);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Admin search error:', error);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
