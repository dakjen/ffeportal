import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth-edge';

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    const { submissionId } = context.params;

    // Authentication and Authorization: Manually parse cookie from headers
    const cookieHeader = request.headers.get('cookie');
    const authToken = cookieHeader
      ?.split(';')
      .find(cookie => cookie.trim().startsWith('auth_token='))
      ?.split('=')[1];

    if (!authToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(authToken);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Update the submission status
    await db.update(contactSubmissions)
      .set({ isResolved: true })
      .where(eq(contactSubmissions.id, submissionId));

    return NextResponse.json({ message: 'Submission marked as resolved.' }, { status: 200 });

  } catch (error) {
    console.error('Error marking submission as resolved:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
