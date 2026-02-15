import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
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
      companyName: users.companyName, // Add companyName to selected fields
    })
    .from(users)
    .where(and(
      eq(users.role, 'admin'), // Ensure only admins are returned
      or(
        like(users.name, searchPattern),
        like(users.companyName, searchPattern) // Search by companyName
      )
    ));

    return NextResponse.json({ admins }, { status: 200 });

  } catch (error) {
    console.error('Failed to search for admins:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}