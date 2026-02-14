import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  companyName: z.string().optional(),
  role: z.enum(['client', 'contractor', 'admin']).optional().default('client'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, companyName, role } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await db.insert(users).values({
      name,
      email,
      companyName, // Optional
      passwordHash: hashedPassword,
      role: role, // Use the role from the parsed schema
    }).returning({ id: users.id, email: users.email, role: users.role });

    return NextResponse.json({ message: 'Registration successful', user: newUser[0] }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}