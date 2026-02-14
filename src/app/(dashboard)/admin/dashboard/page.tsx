import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/db';
import { requests, quotes, users } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowUpRight, ClipboardList, CheckCircle, Clock, FileText, Plus } from 'lucide-react';
import QuickActions from './quick-actions';

export default async function AdminDashboardPage() {
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
    console.error('Admin dashboard auth error:', error);
    redirect('/login');
  }

  // Fetch full user details from DB to ensure we have the name
  const [user] = await db.select().from(users).where(eq(users.id, userPayload.id));

  // Fetch all clients for the "Create Quote" dropdown
  const clients = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    companyName: users.companyName
  })
  .from(users)
  .where(eq(users.role, 'client'));

  // Fetch metrics
  const [totalRequests] = await db.select({ count: count() }).from(requests);
  const [pendingRequests] = await db.select({ count: count() }).from(requests).where(eq(requests.status, 'pending'));
  const [activeQuotes] = await db.select({ count: count() }).from(quotes).where(eq(quotes.status, 'sent'));
  const [approvedProjects] = await db.select({ count: count() }).from(requests).where(eq(requests.status, 'approved'));

  // Fetch recent activity (last 5 requests)
  const recentRequests = await db.select()
    .from(requests)
    .orderBy(desc(requests.createdAt))
    .limit(5);

  // Fetch recent sent quotes (last 5)
  const recentSentQuotes = await db.select({
    id: quotes.id,
    projectName: quotes.projectName,
    totalPrice: quotes.totalPrice,
    status: quotes.status,
    createdAt: quotes.createdAt,
    clientName: users.name,
    clientCompanyName: users.companyName,
  })
  .from(quotes)
  .where(eq(quotes.status, 'sent'))
  .leftJoin(users, eq(quotes.clientId, users.id))
  .orderBy(desc(quotes.createdAt))
  .limit(5);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">Dashboard</h1>
          <p className="text-[var(--brand-beige)] mt-1 font-medium">Welcome back, {user?.name || 'Admin'}. Here's what's happening today.</p>
        </div>
        <Link 
          href="/admin/requests" 
          className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
        >
          <ClipboardList className="mr-2 h-4 w-4" /> Manage Requests
        </Link>
      </div>

            {/* Metrics Grid */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* Total Requests */}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>

                  <div className="p-2 bg-gray-100 rounded-lg">

                    <ClipboardList className="h-5 w-5 text-[var(--brand-black)]" />

                  </div>

                </div>

                <p className="text-3xl font-bold text-[var(--brand-black)] mt-auto">{totalRequests.count}</p>

                <span className="text-xs text-[var(--brand-beige)] mt-1 flex items-center font-semibold">

                  <ArrowUpRight className="h-3 w-3 mr-1" /> +12% from last month

                </span>

              </div>

      

              {/* Pending Approval */}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-500">Pending Approval</h3>

                  <div className="p-2 bg-red-50 rounded-lg">

                    <Clock className="h-5 w-5 text-[var(--brand-red)]" />

                  </div>

                </div>

                <p className="text-3xl font-bold text-[var(--brand-black)] mt-auto">{pendingRequests.count}</p>

                <span className="text-xs text-[var(--brand-red)] mt-1 font-medium">Requires attention</span>

              </div>

      

              {/* Active Quotes */}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-500">Active Quotes</h3>

                  <div className="p-2 bg-[var(--brand-white)] rounded-lg">

                    <FileText className="h-5 w-5 text-[var(--brand-beige)]" />

                  </div>

                </div>

                <p className="text-3xl font-bold text-[var(--brand-black)] mt-auto">{activeQuotes.count}</p>

                <span className="text-xs text-gray-500 mt-1">Currently with clients</span>

              </div>

      

              {/* Projects Won */}

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-medium text-gray-500">Projects Won</h3>

                  <div className="p-2 bg-gray-100 rounded-lg">

                    <CheckCircle className="h-5 w-5 text-[var(--brand-black)]" />

                  </div>

                </div>

                <p className="text-3xl font-bold text-[var(--brand-black)] mt-auto">{approvedProjects.count}</p>

                <span className="text-xs text-[var(--brand-beige)] mt-1 flex items-center font-semibold">

                  <ArrowUpRight className="h-3 w-3 mr-1" /> +5 this week

                </span>

              </div>

            </div>

      

            {/* Recent Activity & Quick Actions */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Quick Actions / Notifications Panel */}

                            <QuickActions pendingCount={pendingRequests.count} clients={clients} />

              

                            {/* Recent Requests Table */}

                            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                              <div className="p-6 border-b border-gray-100 flex items-center justify-between">

                                <h3 className="font-semibold text-[var(--brand-black)]">Recent Requests</h3>

                                <Link href="/admin/requests" className="text-sm text-[var(--brand-red)] hover:text-[#5a0404] font-medium">

                                  View All

                                </Link>

                              </div>

                              <div className="overflow-x-auto">

                                <table className="w-full text-sm text-left">

                                  <thead className="bg-[var(--brand-white)] text-gray-500 font-medium border-b border-gray-100">

                                    <tr>

                                      <th className="px-6 py-3">Project Name</th>

                                      <th className="px-6 py-3">Status</th>

                                      <th className="px-6 py-3">Date</th>

                                      <th className="px-6 py-3 text-right">Action</th>

                                    </tr>

                                  </thead>

                                  <tbody className="divide-y divide-gray-100">

                                    {recentRequests.length === 0 ? (

                                      <tr>

                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">

                                          No requests found.

                                        </td>

                                      </tr>

                                    ) : (

                                      recentRequests.map((req) => (

                                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">

                                          <td className="px-6 py-4 font-medium text-[var(--brand-black)]">{req.projectName}</td>

                                          <td className="px-6 py-4">

                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize

                                              ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :

                                                req.status === 'approved' ? 'bg-green-100 text-green-800' :

                                                req.status === 'quoted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>

                                            {req.status}

                                            </span>

                                          </td>

                                          <td className="px-6 py-4 text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>

                                          <td className="px-6 py-4 text-right">

                                            <Link href={`/admin/requests/${req.id}/quote`} className="text-[var(--brand-red)] hover:text-[#5a0404] font-medium">

                                              Manage

                                            </Link>

                                          </td>

                                        </tr>

                                      ))

                                    )}

                                  </tbody>

                                </table>

                              </div>

                            </div>

            </div>

            {/* Recent Quotes Table */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-[var(--brand-black)]">Recent Quotes</h3>
                <Link href="/admin/quotes" className="text-sm text-[var(--brand-red)] hover:text-[#5a0404] font-medium">
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--brand-white)] text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Project Name</th>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Date Sent</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentSentQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No sent quotes found.
                        </td>
                      </tr>
                    ) : (
                      recentSentQuotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-[var(--brand-black)]">{quote.projectName || 'Untitled Quote'}</td>
                          <td className="px-6 py-4 text-gray-700">{quote.clientCompanyName || quote.clientName || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${quote.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                quote.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {quote.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">${parseFloat(quote.totalPrice).toFixed(2)}</td>
                          <td className="px-6 py-4 text-gray-500">{new Date(quote.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/admin/quotes/${quote.id}`} className="text-[var(--brand-red)] hover:text-[#5a0404] font-medium">
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
    </div>
  );
}