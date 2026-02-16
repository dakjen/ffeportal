import { NextResponse } from 'next/server';
import { db } from '@/db';
import { contactSubmissions } from '@/db/schema'; // Import the new schema

export const runtime = 'nodejs'; // Specify Node.js runtime if necessary

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // Insert into database
    await db.insert(contactSubmissions).values({
      id: crypto.randomUUID(), // Generate a UUID for the new submission
      name,
      email,
      subject,
      message,
      createdAt: new Date(),
      isResolved: false, // Default to unresolved
    });

    return NextResponse.json({ message: 'Contact form submitted successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
