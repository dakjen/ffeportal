import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken, hashPassword } from '@/lib/auth';

const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // Fetch team members where parentId is the current user's ID
    const teamMembers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      companyName: users.companyName,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.parentId, payload.id));

    return NextResponse.json({ team: teamMembers }, { status: 200 });
  } catch (error) {
    console.error('Fetch team error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, email, password } = addUserSchema.parse(body);

    // Get current user to inherit company name
    const [currentUser] = await db.select().from(users).where(eq(users.id, payload.id));

    if (!currentUser) return NextResponse.json({ message: 'Parent user not found' }, { status: 404 });

    // Check if new user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    // Create new user linked to current user, inheriting Company Name
    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'client',
      parentId: payload.id, // Link to parent
      companyName: currentUser.companyName, // Inherit Company Name
    }).returning({ id: users.id, name: users.name, email: users.email, companyName: users.companyName });

    return NextResponse.json({ message: 'Team member added successfully', user: newUser }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Add team member error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}