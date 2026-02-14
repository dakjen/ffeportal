import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/db';
import { requests, users } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
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
    if (user.role !== 'client') {
      redirect('/admin/dashboard');
    }
  } catch (error) {
    console.error('Client dashboard auth error:', error);
    redirect('/login');
  }

  // Fetch full user details to get parentId
  const [currentUser] = await db.select().from(users).where(eq(users.id, user.id));

  // Determine "Organization Root ID"
  const rootId = currentUser.parentId || currentUser.id;

  // Find all user IDs in this "Organization" (Root + Children)
  // This simplistic approach assumes only 1 level of depth (Parent -> Children)
  // which matches our implementation.
  const orgUsers = await db.select({ id: users.id })
    .from(users)
    .where(inArray(users.id, [rootId])) // Start with root
    // Ideally we would fetch WHERE id = rootId OR parentId = rootId
    // But Drizzle OR logic needs to be constructed carefully.
    
  // Let's do it in two steps or a proper OR query
  // Fetch all users where id=rootId OR parentId=rootId
  const allTeamMembers = await db.select({ id: users.id })
     .from(users)
     // Raw SQL or OR helper would be better, but let's just fetch all users for this parent
     // Wait, simple query:
  
  // Revised Strategy:
  // 1. Get all users where parentId = rootId
  // 2. Add rootId to that list
  const children = await db.select({ id: users.id }).from(users).where(eq(users.parentId, rootId));
  const teamIds = [rootId, ...children.map(u => u.id)];

  // Fetch requests for any user in this team
  const clientRequests = await db.select()
    .from(requests)
    .where(inArray(requests.clientId, teamIds))
    .orderBy(desc(requests.createdAt));

  // Determine active status for metrics
  const pendingCount = clientRequests.filter(r => r.status === 'pending').length;
  const quotedCount = clientRequests.filter(r => r.status === 'quoted').length;
  const approvedCount = clientRequests.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">My Projects</h1>
          <p className="text-gray-500 mt-1">Track your FF&E requests and quotes.</p>
        </div>
        <Link 
          href="/client/new-request" 
          className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Link>
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

      {/* Request List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-[var(--brand-black)]">Request History</h3>
        </div>
        
        {clientRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No requests yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first FF&E project request.</p>
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientRequests.map((req) => (
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
                      {req.status === 'quoted' ? (
                        <Link href={`/client/requests/${req.id}`} className="text-indigo-600 hover:text-indigo-900">
                          View Quote
                        </Link>
                      ) : (
                        <span className="text-gray-400 cursor-default">View Details</span>
                      )}
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

// Helper component for icon if needed
function ClipboardList(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}
