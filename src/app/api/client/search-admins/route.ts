import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let userPayload;
    try {
      userPayload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (userPayload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can search for admins' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
      return NextResponse.json({ admins: [] }, { status: 200 });
    }

    const searchPattern = `%${query.trim()}%`;

    const admins = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(or(
      eq(users.role, 'admin'), // Ensure only admins are returned
      like(users.name, searchPattern),
      like(users.email, searchPattern)
    ));

    return NextResponse.json({ admins }, { status: 200 });

  } catch (error) {
    console.error('Failed to search for admins:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}