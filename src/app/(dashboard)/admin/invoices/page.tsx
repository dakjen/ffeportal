'use client';

import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface Invoice {
  id: string;
  contractorName: string;
  projectName: string | null;
  description: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/admin/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchInvoices();
    } catch (err) {
      console.error('Failed to update invoice:', err);
    }
  };

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Contractor Invoices</h1>
        <p className="text-gray-500 mt-1">Review and approve costs submitted by contractors.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[var(--brand-black)] text-[var(--brand-white)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Contractor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Project / Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.contractorName}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{inv.projectName || 'General Invoice'}</p>
                      <p className="text-xs text-gray-500">{inv.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">${parseFloat(inv.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          inv.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {inv.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateStatus(inv.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => updateStatus(inv.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                      {inv.status === 'approved' && (
                        <button 
                          onClick={() => updateStatus(inv.id, 'paid')}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                        >
                          <DollarSign className="h-4 w-4" /> Mark Paid
                        </button>
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
