import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { contractorRequests, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import AdminContractorRequestList from './admin-contractor-request-list';
import AcceptedContractorsList from './accepted-contractors-list';

export default async function AdminContractorRequestsPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userPayload;
  try {
    userPayload = await verifyToken(token);
    if (userPayload.role !== 'admin') {
      // Redirect non-admins to their respective dashboards or login
      if (userPayload.role === 'contractor') {
        redirect('/contractor/dashboard');
      } else if (userPayload.role === 'client') {
        redirect('/client/dashboard');
      } else {
        redirect('/login');
      }
    }
  } catch (error) {
    console.error('Admin contractor requests auth error:', error);
    redirect('/login');
  }

  // Fetch pending contractor requests
  const pendingRequests = await db.select({
    id: contractorRequests.id,
    clientId: contractorRequests.clientId,
    clientName: users.name,
    clientEmail: users.email,
    status: contractorRequests.status,
    createdAt: contractorRequests.createdAt,
  })
  .from(contractorRequests)
  .leftJoin(users, eq(contractorRequests.clientId, users.id))
  .where(and(eq(contractorRequests.status, 'pending'), eq(contractorRequests.adminId, userPayload.id)));

  // Fetch accepted contractors (users who are contractors and linked to this admin)
  const acceptedContractors = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    companyName: users.companyName,
    createdAt: users.createdAt,
  })
  .from(users)
  .where(and(eq(users.role, 'contractor'), eq(users.parentId, userPayload.id)))
  .orderBy(desc(users.createdAt));


  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Contractor Requests</h1>
        <p className="text-gray-500 mt-1">Review and manage requests from contractors to join your platform.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Pending Requests</h2>
        <AdminContractorRequestList initialRequests={pendingRequests} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <AcceptedContractorsList contractors={acceptedContractors} />
      </div>
    </div>
  );
}