// src/app/api/admin/pricing-entries/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingEntries } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { desc } from 'drizzle-orm';

const pricingEntrySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  internalCostInput: z.coerce.number().min(0).optional(),
  marginInput: z.coerce.number().min(0).optional(),
  calculatedPrice: z.coerce.number().min(0).optional(), // Can be undefined on create
  pricingType: z.enum(['hourly', 'flat']).default('flat'),
  roundOption: z.enum(['none', 'up', 'down']).default('none'),
  description: z.string().optional(),
  link: z.string().optional(),
  projectNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const allPricingEntries = await db.select().from(pricingEntries).orderBy(desc(pricingEntries.createdAt));

    return NextResponse.json({ pricingEntries: allPricingEntries }, { status: 200 });
  } catch (error) {
    console.error('Fetch pricing entries error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const data = pricingEntrySchema.parse(body);

    const [newPricingEntry] = await db.insert(pricingEntries).values({
      name: data.name,
      internalCostInput: data.internalCostInput?.toFixed(2),
      marginInput: data.marginInput?.toFixed(2),
      calculatedPrice: data.calculatedPrice?.toFixed(2),
      pricingType: data.pricingType,
      roundOption: data.roundOption,
      description: data.description,
      link: data.link,
      projectNotes: data.projectNotes,
      clientNotes: data.clientNotes,
    }).returning();

    return NextResponse.json({ message: 'Pricing entry added successfully', pricingEntry: newPricingEntry }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Add pricing entry error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
