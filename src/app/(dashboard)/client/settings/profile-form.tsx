'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface User {
  name: string;
  email: string;
  companyName: string | null;
}

export default function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      companyName: user.companyName || '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update profile');
      }

      setProfileSuccess('Profile updated successfully.');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setLoading(true);
    setPasswordSuccess('');
    setPasswordError('');
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update password');
      }

      setPasswordSuccess('Password updated successfully.');
      resetPassword();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Profile Form Section */}
      <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            id="name"
            type="text"
            {...registerProfile('name')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
          />
          {profileErrors.name && <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            id="companyName"
            type="text"
            {...registerProfile('companyName')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
          />
          {profileErrors.companyName && <p className="mt-1 text-sm text-red-600">{profileErrors.companyName.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm p-2 text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed directly. Contact support.</p>
        </div>

        {profileSuccess && <p className="text-sm text-green-600 font-medium">{profileSuccess}</p>}
        {profileError && <p className="text-sm text-red-600 font-medium">{profileError}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-[var(--brand-black)] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <hr className="border-gray-200" />

      {/* Password Form Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--brand-black)]">Change Password</h2>
          <p className="text-sm text-gray-500">Update your password securely.</p>
        </div>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              {...registerPassword('currentPassword')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            />
            {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="newPassword"
              type="password"
              {...registerPassword('newPassword')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            />
            {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              {...registerPassword('confirmPassword')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            />
            {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>}
          </div>

          {passwordSuccess && <p className="text-sm text-green-600 font-medium">{passwordSuccess}</p>}
          {passwordError && <p className="text-sm text-red-600 font-medium">{passwordError}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-[var(--brand-red)] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
