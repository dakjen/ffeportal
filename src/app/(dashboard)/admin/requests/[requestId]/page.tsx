import { db } from '@/db';
import { quotes, requests, users, quoteItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import Link from 'next/link';
import { Download, ArrowLeft, Edit, Plus } from 'lucide-react';

export default async function AdminRequestDetailsPage({ params }: { params: { requestId: string } }) {
  const { requestId } = await params;

  const token = (await cookies()).get('auth_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    redirect('/client/dashboard');
  }

  // Fetch request details
  const [request] = await db.select().from(requests).where(eq(requests.id, requestId));

  if (!request) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-bold">Request Not Found</h2>
        <p>The request you are looking for does not exist.</p>
        <Link href="/admin/requests" className="mt-4 inline-block text-[var(--brand-red)] hover:underline">
          <ArrowLeft className="inline-block h-4 w-4 mr-1" /> Back to Requests
        </Link>
      </div>
    );
  }

  // Fetch Client Details
  const [client] = await db.select().from(users).where(eq(users.id, request.clientId));

  // Fetch the quote associated with this request
  const [quote] = await db.select().from(quotes).where(eq(quotes.requestId, requestId));

  // Fetch quote items only if quote exists
  let items: any[] = [];
  if (quote) {
    items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quote.id));
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">Project: {request.projectName}</h1>
          <Link href="/admin/requests" className="text-sm text-gray-500 hover:text-[var(--brand-red)] mt-1 inline-flex items-center">
             <ArrowLeft className="mr-1 h-3 w-3" /> Back to Requests
          </Link>
        </div>
        <div className="flex gap-2">
            {quote ? (
                <>
                    <Link 
                        href={`/admin/requests/${requestId}/quote`}
                        className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <Edit className="mr-2 h-4 w-4" /> Edit Quote
                    </Link>
                    <Link 
                        href={`/api/quotes/${quote.id}/pdf`} 
                        target="_blank" 
                        className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
                    >
                        <Download className="mr-2 h-4 w-4" /> PDF
                    </Link>
                </>
            ) : (
                <Link 
                    href={`/admin/requests/${requestId}/quote`}
                    className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create Quote
                </Link>
            )}
        </div>
      </div>

      {/* Request Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Request Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <p className="text-gray-700 mb-2"><strong>Client:</strong> {client ? client.name : 'Unknown'}</p>
                <p className="text-gray-700 mb-2"><strong>Email:</strong> {client ? client.email : '-'}</p>
                <p className="text-gray-700 mb-2"><strong>Company:</strong> {client?.companyName || '-'}</p>
            </div>
            <div>
                <p className="text-gray-700 mb-2"><strong>Status:</strong> <span className="capitalize">{request.status}</span></p>
                <p className="text-gray-700 mb-2"><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="text-gray-600 mt-1">{request.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Quote Section */}
      {quote ? (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Quote Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p className="text-gray-700"><strong>Quote ID:</strong> {quote.id}</p>
                    <p className="text-gray-700"><strong>Status:</strong> <span className="font-semibold capitalize">{quote.status}</span></p>
                </div>
                <div>
                    <p className="text-gray-700">Items Subtotal: <span className="font-semibold">${parseFloat(quote.netPrice || '0').toFixed(2)}</span></p>
                    {parseFloat(quote.taxRate || '0') > 0 && (
                    <p className="text-gray-700">Tax ({(parseFloat(quote.taxRate || '0') * 100).toFixed(2)}%): <span className="font-semibold">${parseFloat(quote.taxAmount || '0').toFixed(2)}</span></p>
                    )}
                    {parseFloat(quote.deliveryFee || '0') > 0 && (
                    <p className="text-gray-700">Delivery Fee: <span className="font-semibold">${parseFloat(quote.deliveryFee || '0').toFixed(2)}</span></p>
                    )}
                    <p className="text-gray-700 text-lg font-bold mt-2">Total Quote Price: <span className="font-semibold">${parseFloat(quote.totalPrice || '0').toFixed(2)}</span></p>
                </div>
            </div>
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
            <p className="text-gray-500 mb-4">No quote has been created for this project request yet.</p>
            <Link 
                href={`/admin/requests/${requestId}/quote`}
                className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
            >
                <Plus className="mr-2 h-5 w-5" /> Start Building Quote
            </Link>
        </div>
      )}
    </div>
  );
}
