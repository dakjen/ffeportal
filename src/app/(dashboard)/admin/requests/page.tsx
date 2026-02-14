import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/db';
import { requests, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function AdminRequestsPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = await verifyToken(token);
    if (user.role !== 'admin') {
      redirect('/client/dashboard');
    }
  } catch (error) {
    console.error('Admin requests page auth error:', error);
    redirect('/login');
  }

  const allRequests = await db.select({
    id: requests.id,
    projectName: requests.projectName,
    description: requests.description,
    status: requests.status,
    clientName: users.name,
    createdAt: requests.createdAt,
  })
  .from(requests)
  .leftJoin(users, eq(requests.clientId, users.id))
  .orderBy(desc(requests.createdAt));

  const activeRequests = allRequests.filter(req => 
    ['pending', 'quoted', 'approved', 'contract_sent'].includes(req.status)
  );

  const pastRequests = allRequests.filter(req => 
    ['completed'].includes(req.status)
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-[var(--brand-black)] mb-4">Manage Client Requests</h2>

      {/* Active Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-[var(--brand-black)]">Active Requests</h3>
        </div>
        
        {activeRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No active client requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[var(--brand-white)]">
              <thead>
                <tr className="bg-[var(--brand-black)] text-[var(--brand-beige)]">
                  <th className="py-3 px-4 text-left">Project Name</th>
                  <th className="py-3 px-4 text-left">Client</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeRequests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--brand-black)]">{req.projectName}</td>
                    <td className="py-3 px-4 text-gray-700">{req.clientName || 'N/A'}</td>
                    <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${req.status === 'pending' ? 'bg-[var(--brand-beige)] text-[var(--brand-black)]' : 
                              req.status === 'approved' ? 'bg-[var(--brand-black)] text-[var(--brand-white)]' : 
                              req.status === 'quoted' ? 'bg-[var(--brand-red)] text-[var(--brand-white)]' : 'bg-gray-100 text-gray-800'}`}>
                            {req.status}
                          </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/requests/${req.id}`} className="text-[var(--brand-red)] hover:text-[#5a0404] font-medium">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-[var(--brand-black)]">Past Requests</h3>
        </div>
        
        {pastRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No past client requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[var(--brand-white)]">
              <thead>
                <tr className="bg-[var(--brand-black)] text-[var(--brand-beige)]">
                  <th className="py-3 px-4 text-left">Project Name</th>
                  <th className="py-3 px-4 text-left">Client</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastRequests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--brand-black)]">{req.projectName}</td>
                    <td className="py-3 px-4 text-gray-700">{req.clientName || 'N/A'}</td>
                    <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${req.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {req.status}
                          </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/requests/${req.id}`} className="text-[var(--brand-red)] hover:text-[#5a0404] font-medium">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}