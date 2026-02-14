// src/app/api/admin/pricing-entries/[entryId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingEntries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const updatePricingEntrySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  internalCostInput: z.coerce.number().min(0).optional(),
  marginInput: z.coerce.number().min(0).optional(),
  calculatedPrice: z.coerce.number().min(0).optional(),
  pricingType: z.enum(['hourly', 'flat']).optional(),
  roundOption: z.enum(['none', 'up', 'down']).optional(),
  description: z.string().optional(),
  link: z.string().optional(),
  projectNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    const { entryId } = await params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const [entry] = await db.select().from(pricingEntries).where(eq(pricingEntries.id, entryId));

    if (!entry) {
      return NextResponse.json({ message: 'Pricing entry not found' }, { status: 404 });
    }

    return NextResponse.json({ pricingEntry: entry }, { status: 200 });

  } catch (error) {
    console.error('Error fetching pricing entry details:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    const { entryId } = await params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const data = updatePricingEntrySchema.parse(body);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.internalCostInput !== undefined) updateData.internalCostInput = data.internalCostInput.toFixed(2);
    if (data.marginInput !== undefined) updateData.marginInput = data.marginInput.toFixed(2);
    if (data.calculatedPrice !== undefined) updateData.calculatedPrice = data.calculatedPrice.toFixed(2);
    if (data.pricingType !== undefined) updateData.pricingType = data.pricingType;
    if (data.roundOption !== undefined) updateData.roundOption = data.roundOption;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.link !== undefined) updateData.link = data.link;
    if (data.projectNotes !== undefined) updateData.projectNotes = data.projectNotes;
    if (data.clientNotes !== undefined) updateData.clientNotes = data.clientNotes;

    const [updatedEntry] = await db.update(pricingEntries)
      .set(updateData)
      .where(eq(pricingEntries.id, entryId))
      .returning();

    if (!updatedEntry) {
      return NextResponse.json({ message: 'Pricing entry not found or not updated' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pricing entry updated successfully', pricingEntry: updatedEntry }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    console.error('Error updating pricing entry:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    const { entryId } = await params;

    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const [deletedEntry] = await db.delete(pricingEntries)
      .where(eq(pricingEntries.id, entryId))
      .returning();

    if (!deletedEntry) {
      return NextResponse.json({ message: 'Pricing entry not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pricing entry deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Delete pricing entry error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
