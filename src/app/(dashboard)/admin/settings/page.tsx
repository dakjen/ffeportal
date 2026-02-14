import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProfileForm from './profile-form';

export default async function AdminSettingsPage() {
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
    redirect('/login');
  }

  // Fetch full user details
  const [user] = await db.select().from(users).where(eq(users.id, userPayload.id));

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Admin Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and security.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[var(--brand-black)]">Personal Information</h2>
          <p className="text-sm text-gray-500">Update your account details.</p>
        </div>
        <div className="p-6">
          <ProfileForm user={user} />
        </div>
      </div>
    </div>
  );
}
