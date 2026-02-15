import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { requests, users } from '@/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import LaborRequestManager from './labor-request-manager';

export default async function LaborRequestsPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userPayload;
  try {
    userPayload = await verifyToken(token);
    if (userPayload.role !== 'admin') {
      redirect('/client/dashboard');
    }
  } catch (error) {
    console.error('Labor requests page auth error:', error);
    redirect('/login');
  }

  // Fetch active contractors for this admin
  const contractors = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    companyName: users.companyName,
  })
  .from(users)
  .where(and(eq(users.role, 'contractor'), eq(users.parentId, userPayload.id)))
  .orderBy(users.name);

  // Fetch active client requests (pending or quoted)
  const clientRequests = await db.select({
    id: requests.id,
    projectName: requests.projectName,
    description: requests.description,
    status: requests.status,
    clientName: users.name,
    createdAt: requests.createdAt,
  })
  .from(requests)
  .leftJoin(users, eq(requests.clientId, users.id))
  .where(or(eq(requests.status, 'pending'), eq(requests.status, 'quoted')))
  .orderBy(desc(requests.createdAt));

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-[var(--brand-black)]">Labor Requests</h1>
        <p className="text-gray-500 mt-1">Request quotes from your contractors for client projects.</p>
      </div>

      <div className="flex-1">
        <LaborRequestManager contractors={contractors} clientRequests={clientRequests} />
      </div>
    </div>
  );
}