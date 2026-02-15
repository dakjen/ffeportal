'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const contractorProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().min(1, 'Company Name is required').nullable(),
  ein: z.string().min(1, 'EIN is required'),
  licenseNumber: z.string().nullable().optional(),
  insuranceInfo: z.string().nullable().optional(),
  trades: z.string().nullable().optional(),
  website: z.string().url().nullable().or(z.literal('')),
  description: z.string().min(1, 'Description is required'),
  brandColorPrimary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid Hex Color').optional().default('#710505'),
  brandColorSecondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid Hex Color').optional().default('#f0f0f0'),
});

type ContractorProfileFormValues = z.infer<typeof contractorProfileSchema>;

interface ContractorProfileFormProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
    ein: string | null;
    licenseNumber: string | null;
    insuranceInfo: string | null;
    trades: string | null;
    website: string | null;
    description: string | null;
    brandColorPrimary: string;
    brandColorSecondary: string;
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
      ein: initialData.ein || '',
      licenseNumber: initialData.licenseNumber || '',
      insuranceInfo: initialData.insuranceInfo || '',
      trades: initialData.trades || '',
      website: initialData.website || '',
      description: initialData.description || '',
      brandColorPrimary: initialData.brandColorPrimary,
      brandColorSecondary: initialData.brandColorSecondary,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div>
          <label htmlFor="ein" className="block text-sm font-medium text-gray-700">EIN (Employer Identification Number)</label>
          <input
            id="ein"
            {...register('ein')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
            placeholder="XX-XXXXXXX"
          />
          {errors.ein && <p className="text-red-600 text-xs mt-1">{errors.ein.message}</p>}
        </div>

        <div>
          <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">License Number</label>
          <input
            id="licenseNumber"
            {...register('licenseNumber')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
            placeholder="Contractor License #"
          />
          {errors.licenseNumber && <p className="text-red-600 text-xs mt-1">{errors.licenseNumber.message}</p>}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
          <input
            id="website"
            {...register('website')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
            placeholder="https://yourcompany.com"
          />
          {errors.website && <p className="text-red-600 text-xs mt-1">{errors.website.message}</p>}
        </div>

         <div>
          <label htmlFor="trades" className="block text-sm font-medium text-gray-700">Trades / Specialties</label>
          <input
            id="trades"
            {...register('trades')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
            placeholder="e.g. Plumbing, Electrical, HVAC (comma separated)"
          />
          {errors.trades && <p className="text-red-600 text-xs mt-1">{errors.trades.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="insuranceInfo" className="block text-sm font-medium text-gray-700">Insurance Information</label>
        <textarea
          id="insuranceInfo"
          {...register('insuranceInfo')}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
          placeholder="Policy number, provider, expiration date, etc."
        />
        {errors.insuranceInfo && <p className="text-red-600 text-xs mt-1">{errors.insuranceInfo.message}</p>}
      </div>

       <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Company Description</label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
          placeholder="Tell us about your company and services..."
        />
        {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="brandColorPrimary" className="block text-sm font-medium text-gray-700">Primary Brand Color</label>
          <div className="flex items-center mt-1">
            <input
              type="color"
              id="brandColorPrimary"
              {...register('brandColorPrimary')}
              className="w-12 h-8 cursor-pointer border-none rounded-md p-0 overflow-hidden"
              title="Choose your primary brand color"
            />
            <input
              type="text"
              {...register('brandColorPrimary')}
              className="ml-3 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900"
              placeholder="#RRGGBB"
            />
          </div>
          {errors.brandColorPrimary && <p className="text-red-600 text-xs mt-1">{errors.brandColorPrimary.message}</p>}
        </div>

        <div>
          <label htmlFor="brandColorSecondary" className="block text-sm font-medium text-gray-700">Secondary Brand Color</label>
          <div className="flex items-center mt-1">
            <input
              type="color"
              id="brandColorSecondary"
              {...register('brandColorSecondary')}
              className="w-12 h-8 cursor-pointer border-none rounded-md p-0 overflow-hidden"
              title="Choose your secondary brand color"
            />
            <input
              type="text"
              {...register('brandColorSecondary')}
              className="ml-3 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900"
              placeholder="#RRGGBB"
            />
          </div>
          {errors.brandColorSecondary && <p className="text-red-600 text-xs mt-1">{errors.brandColorSecondary.message}</p>}
        </div>
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