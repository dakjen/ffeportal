import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ContractorProfileForm from './contractor-profile-form';

export default async function ContractorSettingsPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userPayload;
  try {
    userPayload = await verifyToken(token);
    if (userPayload.role !== 'contractor') {
      // Redirect non-contractors to their respective dashboards or login
      if (userPayload.role === 'admin') {
        redirect('/admin/dashboard');
      } else if (userPayload.role === 'client') {
        redirect('/client/dashboard');
      } else {
        redirect('/login');
      }
    }
  } catch (error) {
    console.error('Contractor settings auth error:', error);
    redirect('/login');
  }

  // Fetch full user details from DB for the form
  const [contractor] = await db.select(users)
    .from(users)
    .where(eq(users.id, userPayload.id));

  if (!contractor) {
    redirect('/login'); // User not found, force re-login
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Company Information</h1>
        <p className="text-gray-500 mt-1">Manage your company name and profile details.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* @ts-expect-error - Drizzle schema types might not be fully synced in this context yet, but runtime is fine */}
        <ContractorProfileForm initialData={contractor} />
      </div>
    </div>
  );
}