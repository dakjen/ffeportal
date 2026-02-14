import { NextResponse } from 'next/server';
import { db } from '@/db';
import { requests, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { requestId } = await params;
    console.log('API: Attempting to fetch requestId:', requestId);

    const [requestData] = await db.select()
    .from(requests)
    .where(eq(requests.id, requestId));

    console.log('API: Result of db.select for requestData:', requestData);

    if (!requestData) {
      console.log('API: requestData is null/undefined, returning 404');
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    const [clientData] = await db.select()
    .from(users)
    .where(eq(users.id, requestData.clientId));

    if (!clientData) {
      // This should ideally not happen if requests.clientId is a valid FK
      return NextResponse.json({ message: 'Client not found for this request' }, { status: 404 });
    }

    const request = {
        id: requestData.id,
        projectName: requestData.projectName,
        description: requestData.description,
        status: requestData.status,
        clientName: clientData.name,
        clientId: clientData.id,
        createdAt: requestData.createdAt,
    };

    if (!request) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ request }, { status: 200 });

  } catch (error) {
    console.error('Error fetching request details:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
