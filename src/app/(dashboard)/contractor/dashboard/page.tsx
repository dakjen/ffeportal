import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/db';
import { invoices, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, DollarSign, Clock, CheckCircle } from 'lucide-react';

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

  const contractorInvoices = await db.select()
    .from(invoices)
    .where(eq(invoices.contractorId, user.id))
    .orderBy(desc(invoices.createdAt));

  const totalSubmitted = contractorInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const pendingAmount = contractorInvoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">Contractor Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your project costs and invoices.</p>
        </div>
        <Link 
          href="/contractor/invoices/new" 
          className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> Submit Cost / Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
