import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  companyName: z.string().nullable().optional(),
  ein: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  insuranceInfo: z.string().nullable().optional(),
  trades: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  brandColorPrimary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid Hex Color').optional(),
  brandColorSecondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid Hex Color').optional(),
});

export async function PUT(req: Request) {
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

    if (userPayload.role !== 'contractor') {
      return NextResponse.json({ message: 'Forbidden: Only contractors can update this profile' }, { status: 403 });
    }

    const body = await req.json();
    const { name, companyName, ein, licenseNumber, insuranceInfo, trades, website, description, brandColorPrimary, brandColorSecondary } = profileUpdateSchema.parse(body);

    await db.update(users)
      .set({
        name: name,
        companyName: companyName,
        ein: ein,
        licenseNumber: licenseNumber,
        insuranceInfo: insuranceInfo,
        trades: trades,
        website: website,
        description: description,
        brandColorPrimary: brandColorPrimary,
        brandColorSecondary: brandColorSecondary,
      })
      .where(eq(users.id, userPayload.id));

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Failed to update contractor profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}