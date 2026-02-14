import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import SearchAdminsForm from './search-admins-form';

export default async function RequestContractorPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userPayload;
  try {
    userPayload = await verifyToken(token);
    if (userPayload.role !== 'client') {
      // Redirect non-clients to their respective dashboards or login
      if (userPayload.role === 'admin') {
        redirect('/admin/dashboard');
      } else if (userPayload.role === 'contractor') {
        redirect('/contractor/dashboard');
      } else {
        redirect('/login');
      }
    }
  } catch (error) {
    console.error('Request contractor auth error:', error);
    redirect('/login');
  }

  // Fetch client's own data
  const [client] = await db.select()
    .from(users)
    .where(eq(users.id, userPayload.id));

  if (!client) {
    redirect('/login'); // User not found, force re-login
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Request Contractor Link</h1>
        <p className="text-gray-500 mt-1">Search for an administrator to link with and send a request.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <SearchAdminsForm clientId={client.id} />
      </div>
    </div>
  );
}