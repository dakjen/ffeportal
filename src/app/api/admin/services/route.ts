import { NextResponse } from 'next/server';
import { db } from '@/db';
import { services, servicePricing } from '@/db/schema'; // Add servicePricing
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { desc, eq } from 'drizzle-orm'; // Ensure eq is imported

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const allServices = await db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        isActive: services.isActive,
        createdAt: services.createdAt,
        price: servicePricing.price,
        pricingType: servicePricing.pricingType,
        internalCost: servicePricing.internalCost,
        margin: servicePricing.margin,
      })
      .from(services)
      .leftJoin(servicePricing, eq(services.id, servicePricing.serviceId))
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

    const result = await db.transaction(async (tx) => {
      // 1. Insert the new service
      const [newService] = await tx.insert(services).values({
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      }).returning();

      if (!newService) {
        throw new Error('Failed to create service');
      }

      // 2. Create a default servicePricing record for the new service
      const [newPricing] = await tx.insert(servicePricing).values({
        serviceId: newService.id,
        price: '0.00',
        pricingType: 'flat', // Default
        internalCost: '0.00',
        margin: '0.00',
      }).returning();

      if (!newPricing) {
        throw new Error('Failed to create default service pricing');
      }

      return { ...newService, pricing: newPricing }; // Return combined data
    });

    return NextResponse.json({ message: 'Service added successfully', service: result }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    console.error('Add service error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
