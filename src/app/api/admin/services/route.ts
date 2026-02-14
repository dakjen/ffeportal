import { NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { desc } from 'drizzle-orm';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  pricingType: z.enum(['hourly', 'flat']),
  internalCost: z.coerce.number().optional(),
  margin: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const allServices = await db
      .select()
      .from(services)
      .orderBy(desc(services.createdAt));

    return NextResponse.json({ services: allServices }, { status: 200 });
  } catch (error) {
    console.error('Fetch services error:', error);
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
    const data = serviceSchema.parse(body);

    const [newService] = await db.insert(services).values({
      name: data.name,
      description: data.description,
      price: data.price.toFixed(2),
      pricingType: data.pricingType,
      internalCost: data.internalCost ? data.internalCost.toFixed(2) : null,
      margin: data.margin ? data.margin.toFixed(2) : null,
      isActive: data.isActive ?? true,
    }).returning();

    return NextResponse.json({ message: 'Service added successfully', service: newService }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Add service error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
