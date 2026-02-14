import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { quotes, users, requests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Edit, Trash } from 'lucide-react';
import DeleteQuoteButton from './delete-quote-button'; // Import the new component

export default async function AdminQuotesPage() {
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
    console.error('Admin quotes page auth error:', error);
    redirect('/login');
  }

  const allQuotes = await db.select({
    id: quotes.id,
    status: quotes.status,
    totalPrice: quotes.totalPrice,
    createdAt: quotes.createdAt,
    clientName: users.name,
    quoteProjectName: quotes.projectName,
    requestProjectName: requests.projectName,
  })
  .from(quotes)
  .leftJoin(users, eq(quotes.clientId, users.id))
  .leftJoin(requests, eq(quotes.requestId, requests.id))
  .orderBy(desc(quotes.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--brand-black)]">Manage Quotes</h2>
        {/* We could add a "Create Quote" button here too, reusing Quick Actions logic essentially */}
      </div>

      {allQuotes.length === 0 ? (
        <p className="text-gray-700">No quotes found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full bg-[var(--brand-white)]">
            <thead>
              <tr className="bg-[var(--brand-black)] text-[var(--brand-beige)]">
                <th className="py-3 px-4 text-left">Project Name</th>
                <th className="py-3 px-4 text-left">Client</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Total</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allQuotes.map((quote) => (
                <tr key={quote.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[var(--brand-black)]">
                    {quote.quoteProjectName || quote.requestProjectName || 'Untitled Project'}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{quote.clientName || 'N/A'}</td>
                  <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${quote.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            quote.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {quote.status}
                        </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">${parseFloat(quote.totalPrice).toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(quote.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right flex justify-end gap-2">
                    <Link href={`/admin/quotes/${quote.id}`} className="text-gray-600 hover:text-[var(--brand-black)]">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <DeleteQuoteButton quoteId={quote.id} quoteStatus={quote.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
