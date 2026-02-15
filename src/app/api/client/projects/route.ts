import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

const projectSchema = z.object({
  name: z.string().min(1, 'Project Name is required'),
  location: z.string().min(1, 'Project Location is required'),
  description: z.string().min(1, 'Project Description is required'),
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can create projects' }, { status: 403 });
    }

    const body = await req.json();
    const { name, location, description } = projectSchema.parse(body);

    const [newProject] = await db.insert(projects).values({
      clientId: payload.id,
      name,
      location,
      description,
    }).returning();

    return NextResponse.json({ message: 'Project created successfully', project: newProject }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    console.error('Create project error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'client') {
      return NextResponse.json({ message: 'Forbidden: Only clients can view their projects' }, { status: 403 });
    }

    const clientProjects = await db.select({
      id: projects.id,
      name: projects.name,
      location: projects.location,
      description: projects.description,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.clientId, payload.id))
    .orderBy(desc(projects.createdAt));

    return NextResponse.json(clientProjects, { status: 200 });

  } catch (error) {
    console.error('Fetch client projects error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
