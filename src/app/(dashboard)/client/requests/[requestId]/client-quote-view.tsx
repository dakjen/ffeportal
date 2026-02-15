'use client'; // This is a client component for interactive elements

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { QuoteNotesForm } from './quote-notes-form';
import { toast } from 'sonner';

import { QuoteItem } from '@/types/quote';

// Interfaces for data passed from the Server Component `page.tsx`
interface RequestData {
  id: string;
  projectName: string;
  description: string | null;
  status: string;
  createdAt: Date;
  clientId: string;
}

interface QuoteData {
  id: string;
  status: string;
  netPrice: string;
  taxRate: string | null;
  taxAmount: string | null;
  deliveryFee: string | null;
  totalPrice: string;
  requestId: string | null;
}

interface ClientQuoteViewProps {
  request: RequestData;
  quote: QuoteData | null;
  items: QuoteItem[];
  userId: string;
}

export default function ClientQuoteView({ request, quote, items, userId }: ClientQuoteViewProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);

  // Authorize: Only the client who owns the request can view it
  // This check would ideally also happen on the server-side page.tsx
  // but keeping it here for client-side route protection.
  if (request.clientId !== userId) {
    // This redirect won't work perfectly in a client component loaded conditionally.
    // The server component should handle primary authorization.
    // For now, client-side protection only.
    // Better: let the parent (server) component handle the full redirect
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this request.</p>
        <Link href="/client/current-projects" className="mt-4 inline-block text-[var(--brand-red)] hover:underline">
          <ArrowLeft className="inline-block h-4 w-4 mr-1" /> Back to Projects
        </Link>
      </div>
    );
  }

  const showQuote = quote && quote.status !== 'draft';

  const handleApproveQuote = async () => {
    if (!quote || !window.confirm('Are you sure you want to approve this quote? This action cannot be undone.')) {
      return;
    }

    setApproving(true);
    try {
      const res = await fetch(`/api/client/quotes/${quote.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to approve quote');
      }

      toast.success('Quote approved successfully!');
      router.refresh(); // Re-fetch data on the page
    } catch (error: any) {
      toast.error(error.message || 'Error approving quote');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">Project: {request.projectName}</h1>
          <Link href="/client/current-projects" className="text-sm text-gray-500 hover:text-[var(--brand-red)] mt-1 inline-flex items-center">
             <ArrowLeft className="mr-1 h-3 w-3" /> Back to Projects
          </Link>
        </div>
        {showQuote && quote && (
          <Link 
            href={`/api/quotes/${quote.id}/pdf`} 
            target="_blank" 
            className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Link>
        )}
      </div>

      {/* Request Details - Always visible */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Request Details</h2>
        <p className="text-gray-700 mb-2"><strong>Status:</strong> <span className="capitalize">{request.status}</span></p>
        <p className="text-gray-700 mb-2"><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
        <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="text-gray-600 mt-1">{request.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Quote Section - Conditional Two-Column Layout */}
      {showQuote && quote ? ( // Add quote to condition
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Quote Items */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Quote Items</h2>
            {items.length === 0 ? (
              <p className="text-gray-500">No items in this quote.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.serviceName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(String(item.quantity || 0)).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(String(item.unitPrice || 0)).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">${parseFloat(String(item.price || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Quote Details & Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Quote Summary</h2>
              <p className="text-gray-700 mb-2">Status: <span className="font-semibold capitalize">{quote.status}</span></p>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold">${parseFloat(quote.netPrice).toFixed(2)}</span>
                </div>
                {parseFloat(quote.taxRate || '0') > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax ({(parseFloat(quote.taxRate || '0') * 100).toFixed(2)}%):</span>
                    <span className="font-semibold">${parseFloat(quote.taxAmount || '0').toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(quote.deliveryFee || '0') > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Fee:</span>
                    <span className="font-semibold">${parseFloat(quote.deliveryFee || '0').toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-[var(--brand-black)] mt-4 pt-4 border-t border-gray-200">
                  <span>Total Quote Price:</span>
                  <span>${parseFloat(quote.totalPrice || '0').toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Client Actions */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-[var(--brand-black)] mb-4">Actions</h3>
                {quote.status === 'sent' && (
                    <div className="space-y-4"> {/* Changed to space-y for vertical stacking */}
                        <button
                            onClick={handleApproveQuote}
                            disabled={approving}
                            className="flex-1 w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve Quote'}
                        </button>
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Notes / Revision Request:</p>
                            {/* QuoteNotesForm will be rendered here */}
                            <QuoteNotesForm quoteId={quote.id} onNotesSubmitted={() => router.refresh()} />
                        </div>
                    </div>
                )}
                {quote.status === 'approved' && (
                    <p className="text-green-600 font-medium">This quote has been approved.</p>
                )}
                {quote.status === 'revised' && (
                    <p className="text-blue-600 font-medium">This quote has been revised. Please review the new version.</p>
                )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Quote Pending</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
                We are currently reviewing your request and preparing a quote. You will be notified via email when it is ready.
            </p>
        </div>
      )}
    </div>
  );
}
