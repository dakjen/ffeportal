import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { users, contractorRequests } from '@/db/schema';
import { eq, or, and, like, desc } from 'drizzle-orm';
import AdminSearch from './admin-search';
import { User, CheckCircle, Clock } from 'lucide-react';

export default async function SubcontractorRequestPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userPayload;
  try {
    userPayload = await verifyToken(token);
    if (userPayload.role !== 'contractor') {
      redirect('/login');
    }
  } catch (error) {
    redirect('/login');
  }

  // Fetch all requests sent by this contractor
  const allRequests = await db.select({
    id: contractorRequests.id,
    adminId: contractorRequests.adminId,
    status: contractorRequests.status,
    adminName: users.name,
    adminCompany: users.companyName,
    adminEmail: users.email,
    updatedAt: contractorRequests.updatedAt,
  })
  .from(contractorRequests)
  .leftJoin(users, eq(contractorRequests.adminId, users.id))
  .where(eq(contractorRequests.clientId, userPayload.id))
  .orderBy(desc(contractorRequests.updatedAt));

  const pendingRequests = allRequests.filter(r => r.status === 'pending');
  const acceptedRequests = allRequests.filter(r => r.status === 'approved');
  
  const requestedAdminIds = allRequests.map(r => r.adminId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Subcontractor Request</h1>
        <p className="text-gray-500 mt-1">Connect with admins to join their contractor network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Search Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h2 className="text-lg font-semibold text-[var(--brand-black)] mb-4">Find & Request Admins</h2>
             <AdminSearch existingRequestAdminIds={requestedAdminIds} />
          </div>
        </div>

        {/* Status Column */}
        <div className="space-y-6">
           {/* Accepted Requests */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-green-50">
                 <h3 className="font-semibold text-[#166534] flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Connected Admins
                 </h3>
              </div>
              <div className="divide-y divide-gray-100">
                 {acceptedRequests.length === 0 ? (
                    <p className="text-center text-gray-500 py-6 text-sm">No connected admins yet.</p>
                 ) : (
                    acceptedRequests.map(req => (
                       <div key={req.id} className="p-4 flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                             <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                             <p className="font-medium text-[var(--brand-black)]">{req.adminName}</p>
                             {req.adminCompany && <p className="text-xs text-gray-500">{req.adminCompany}</p>}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Pending Requests */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-yellow-50">
                 <h3 className="font-semibold text-[#854d0e] flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Pending Requests
                 </h3>
              </div>
              <div className="divide-y divide-gray-100">
                 {pendingRequests.length === 0 ? (
                    <p className="text-center text-gray-500 py-6 text-sm">No pending requests.</p>
                 ) : (
                    pendingRequests.map(req => (
                       <div key={req.id} className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="bg-gray-100 p-2 rounded-full">
                                <User className="h-4 w-4 text-gray-600" />
                             </div>
                             <div>
                                <p className="font-medium text-[var(--brand-black)]">{req.adminName}</p>
                                <p className="text-xs text-gray-500">Sent: {new Date(req.updatedAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Pending</span>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}