import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      companyName: users.companyName,
      ein: users.ein,
      licenseNumber: users.licenseNumber,
      insuranceInfo: users.insuranceInfo,
      trades: users.trades,
      website: users.website,
      description: users.description,
      brandColorPrimary: users.brandColorPrimary,
      brandColorSecondary: users.brandColorSecondary,
      role: users.role,
      parentId: users.parentId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, payload.id));

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, companyName } = profileUpdateSchema.parse(body);

    await db.update(users)
      .set({ name, companyName })
      .where(eq(users.id, payload.id));

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}