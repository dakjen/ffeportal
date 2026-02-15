import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { requests, users } from '@/db/schema';
import { eq, desc, inArray, or } from 'drizzle-orm'; // Import 'or' for flexible query
import Link from 'next/link';
import { Plus, Clock, FileText, CheckCircle } from 'lucide-react';

export default async function ClientDashboardPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = await verifyToken(token);
    if (!user || user.role !== 'client') {
      redirect('/login'); // Redirect non-clients or unauthenticated users
    }
  } catch (error) {
    console.error('Client dashboard auth error:', error);
    redirect('/login');
  }

  const userId = user.id;

  // Fetch full user details to get parentId
  const [currentUser] = await db.select().from(users).where(eq(users.id, userId));

  // Determine "Organization Root ID"
  const rootId = currentUser.parentId || currentUser.id;

  // Fetch all users where id=rootId OR parentId=rootId
  const teamMembers = await db.select({ id: users.id })
     .from(users)
     .where(or(eq(users.id, rootId), eq(users.parentId, rootId)));
  const teamIds = teamMembers.map(u => u.id);

  // Fetch all requests for any user in this team
  const allClientRequests = await db.select()
    .from(requests)
    .where(inArray(requests.clientId, teamIds))
    .orderBy(desc(requests.createdAt));

  // Separate requests into Current and History
  const currentRequests = allClientRequests.filter(req => 
    ['pending', 'quoted', 'approved', 'contract_sent'].includes(req.status)
  );

  // Assuming 'rejected' status might exist in the future for requests, not just invoices
  const requestHistory = allClientRequests.filter(req => 
    ['completed'].includes(req.status)
  );


  // Determine active status for metrics (applies to current requests)
  const pendingCount = currentRequests.filter(r => r.status === 'pending').length;
  const quotedCount = currentRequests.filter(r => r.status === 'quoted').length;
  const approvedCount = currentRequests.filter(r => r.status === 'approved').length; // Includes 'approved' and 'contract_sent'


  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your FF&E activity.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/client/current-projects" 
            className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            View Current Projects
          </Link>
          <Link 
            href="/client/new-request" 
            className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-yellow-50 mr-4">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-[var(--brand-black)]">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 mr-4">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Quotes Received</p>
            <p className="text-2xl font-bold text-[var(--brand-black)]">{quotedCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-50 mr-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Approved Projects</p>
            <p className="text-2xl font-bold text-[var(--brand-black)]">{approvedCount}</p>
          </div>
        </div>
      </div>

      {/* Current Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-[var(--brand-black)]">Current Requests</h3>
        </div>
        
        {currentRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active projects</h3>
            <p>You currently have no pending projects. Start a new request!</p>
            <div className="mt-6">
              <Link 
                href="/client/new-request" 
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:ring-offset-2"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Request
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.projectName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{req.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          req.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          req.status === 'quoted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/client/requests/${req.id}`} className="text-[var(--brand-red)] hover:text-[#5a0404]">
                        {req.status === 'quoted' || req.status === 'approved' || req.status === 'contract_sent' ? 'View Quote' : 'View Details'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-[var(--brand-black)]">Request History</h3>
        </div>
        
        {requestHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No past requests</h3>
            <p>Your completed and rejected projects will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requestHistory.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.projectName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{req.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${req.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/client/requests/${req.id}`} className="text-[var(--brand-red)] hover:text-[#5a0404]">
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

