import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { invoices, users, contractorRequests, laborRequests } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, DollarSign, Clock, CheckCircle, UserPlus, FileText, User } from 'lucide-react';

export default async function ContractorDashboardPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = await verifyToken(token);
    if (user.role !== 'contractor') {
      redirect('/login');
    }
  } catch (error) {
    redirect('/login');
  }

  // Fetch invoices for stats
  const contractorInvoices = await db.select()
    .from(invoices)
    .where(eq(invoices.contractorId, user.id))
    .orderBy(desc(invoices.createdAt));

  const totalSubmitted = contractorInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const pendingAmount = contractorInvoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  // Fetch contractor requests for status summary
  const myRequests = await db.select({
    id: contractorRequests.id,
    adminName: users.name,
    status: contractorRequests.status,
    updatedAt: contractorRequests.updatedAt,
  })
  .from(contractorRequests)
  .leftJoin(users, eq(contractorRequests.adminId, users.id))
  .where(eq(contractorRequests.clientId, user.id))
  .orderBy(desc(contractorRequests.updatedAt));

  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const connectedAdmins = myRequests.filter(r => r.status === 'approved');

  // Fetch pending labor requests count
  const pendingLaborRequests = await db.select()
    .from(laborRequests)
    .where(and(eq(laborRequests.contractorId, user.id), eq(laborRequests.status, 'pending')));

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">Contractor Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your work, requests, and invoices.</p>
        </div>
        <Link 
          href="/contractor/invoices/new" 
          className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> Submit Cost / Invoice
        </Link>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subcontractor Request */}
        <Link href="/contractor/subcontractor-request" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center space-y-3 h-full justify-center relative">
             {pendingRequests.length > 0 && (
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                   {pendingRequests.length} Pending
                </div>
             )}
            <div className="bg-blue-50 p-3 rounded-full group-hover:bg-blue-100 transition-colors">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--brand-black)]">Subcontractor Request</h3>
              <p className="text-xs text-gray-500 mt-1">Request to join an admin&apos;s team.</p>
            </div>
          </div>
        </Link>

        {/* Sub Quotes (Labor Requests) */}
        <Link href="/contractor/labor-requests" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center space-y-3 h-full justify-center relative">
            {pendingLaborRequests.length > 0 && (
              <div className="absolute top-4 right-4 bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingLaborRequests.length} Pending
              </div>
            )}
            <div className="bg-orange-50 p-3 rounded-full group-hover:bg-orange-100 transition-colors">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--brand-black)]">Sub Quotes</h3>
              <p className="text-xs text-gray-500 mt-1">Respond to quote requests.</p>
            </div>
          </div>
        </Link>

        {/* Accepted Quotes */}
        <Link href="/contractor/accepted-quotes" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center space-y-3 h-full justify-center">
            <div className="bg-green-50 p-3 rounded-full group-hover:bg-green-100 transition-colors">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--brand-black)]">Accepted Quotes</h3>
              <p className="text-xs text-gray-500 mt-1">Track active project progress.</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Network & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Network Summary */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-1">
            <h3 className="font-semibold text-[var(--brand-black)] mb-4 flex items-center gap-2">
               <User className="h-4 w-4" /> My Network
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Connected Admins</span>
                  <span className="font-semibold text-[var(--brand-black)]">{connectedAdmins.length}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Pending Requests</span>
                  <span className="font-semibold text-yellow-600">{pendingRequests.length}</span>
               </div>
               
               {pendingRequests.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                     <p className="text-xs text-gray-400 mb-2">Recent Pending:</p>
                     {pendingRequests.slice(0, 3).map(req => (
                        <div key={req.id} className="text-xs text-gray-600 truncate mb-1">
                           • {req.adminName}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Financial Stats */}
         <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
               <div className="p-3 rounded-full bg-blue-50 mr-4">
                  <DollarSign className="h-6 w-6 text-blue-600" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">Total Submitted</p>
                  <p className="text-2xl font-bold text-[var(--brand-black)]">${totalSubmitted.toFixed(2)}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
               <div className="p-3 rounded-full bg-yellow-50 mr-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                  <p className="text-2xl font-bold text-[var(--brand-black)]">${pendingAmount.toFixed(2)}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Invoice History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-[var(--brand-black)]">Invoice History</h3>
        </div>
        
        {contractorInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No invoices submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project / Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contractorInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{inv.projectName || 'General Invoice'}</p>
                      <p className="text-xs text-gray-500">{inv.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${parseFloat(inv.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          inv.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
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
