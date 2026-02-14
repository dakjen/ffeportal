'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const contractorProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().min(1, 'Company Name is required').nullable(),
});

type ContractorProfileFormValues = z.infer<typeof contractorProfileSchema>;

interface ContractorProfileFormProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
    role: 'admin' | 'client' | 'contractor';
    parentId: string | null;
    createdAt: Date;
  };
}

export default function ContractorProfileForm({ initialData }: ContractorProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContractorProfileFormValues>({
    resolver: zodResolver(contractorProfileSchema),
    defaultValues: {
      name: initialData.name,
      companyName: initialData.companyName || '',
    },
  });

  const onSubmit = async (data: ContractorProfileFormValues) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/contractor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      router.refresh(); // Refresh the current route to re-fetch server-side props
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
        <input
          id="name"
          {...register('name')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
          placeholder="Your full name"
        />
        {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
        <input
          id="companyName"
          {...register('companyName')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
          placeholder="Your company's legal name"
        />
        {errors.companyName && <p className="text-red-600 text-xs mt-1">{errors.companyName.message}</p>}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}