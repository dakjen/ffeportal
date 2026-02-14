// src/app/(dashboard)/client/requests/[requestId]/page.tsx
import { db } from '@/db';
import { quotes, requests, users, quoteItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Link from 'next/link';
import { Download, ArrowLeft, Clock } from 'lucide-react';

export default async function ClientQuoteViewPage({ params }: { params: { requestId: string } }) {
  const { requestId } = params;

  const token = (await cookies()).get('auth_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'client') {
    // Redirect non-clients or unauthenticated users
    redirect('/login');
  }

  const userId = payload.id;

  // Fetch request and quote details
  const [request] = await db.select().from(requests).where(eq(requests.id, requestId));

  if (!request) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-bold">Request Not Found</h2>
        <p>The request you are looking for does not exist.</p>
        <Link href="/client/dashboard" className="mt-4 inline-block text-[var(--brand-red)] hover:underline">
          <ArrowLeft className="inline-block h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  // Authorize: Only the client who owns the request can view it
  if (request.clientId !== userId) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this request.</p>
        <Link href="/client/dashboard" className="mt-4 inline-block text-[var(--brand-red)] hover:underline">
          <ArrowLeft className="inline-block h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  // Fetch the quote associated with this request
  const [quote] = await db.select().from(quotes).where(eq(quotes.requestId, requestId));

  // Determine if quote content should be shown
  const showQuote = quote && quote.status !== 'draft';

  // Fetch quote items only if quote is shown
  let items: any[] = [];
  if (showQuote) {
    items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">Project: {request.projectName}</h1>
          <Link href="/client/dashboard" className="text-sm text-gray-500 hover:text-[var(--brand-red)] mt-1 inline-flex items-center">
             <ArrowLeft className="mr-1 h-3 w-3" /> Back to Dashboard
          </Link>
        </div>
        {showQuote && (
          <Link 
            href={`/api/quotes/${quote.id}/pdf`} 
            target="_blank" 
            className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Link>
        )}
      </div>

      {/* Request Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Request Details</h2>
        <p className="text-gray-700 mb-2"><strong>Status:</strong> <span className="capitalize">{request.status}</span></p>
        <p className="text-gray-700 mb-2"><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
        <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="text-gray-600 mt-1">{request.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Quote Section */}
      {showQuote ? (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Quote Details</h2>
            <p className="text-gray-700">Status: <span className="font-semibold capitalize">{quote.status}</span></p>
            <p className="text-gray-700">Items Subtotal: <span className="font-semibold">${parseFloat(quote.netPrice).toFixed(2)}</span></p>
            {parseFloat(quote.taxRate || '0') > 0 && (
              <p className="text-gray-700">Tax ({(parseFloat(quote.taxRate || '0') * 100).toFixed(2)}%): <span className="font-semibold">${parseFloat(quote.taxAmount || '0').toFixed(2)}</span></p>
            )}
            {parseFloat(quote.deliveryFee || '0') > 0 && (
              <p className="text-gray-700">Delivery Fee: <span className="font-semibold">${parseFloat(quote.deliveryFee || '0').toFixed(2)}</span></p>
            )}
            <p className="text-gray-700 text-lg font-bold mt-2">Total Quote Price: <span className="font-semibold">${parseFloat(quote.totalPrice || '0').toFixed(2)}</span></p>
          </div>

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
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.serviceName}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseFloat(item.quantity).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(item.unitPrice).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">${parseFloat(item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
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
