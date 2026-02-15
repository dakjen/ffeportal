'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const createQuoteSchema = z.object({
  projectName: z.string().min(1, 'Quote Name is required'),
  clientId: z.string().uuid('Client is required').nullable(),
  notes: z.string().optional(),
});

type CreateQuoteFormValues = z.infer<typeof createQuoteSchema>;

interface QuickActionsProps {
  pendingCount: number;
  clients: { id: string; name: string; email: string; companyName: string | null }[];
}

export default function QuickActions({ pendingCount, clients }: QuickActionsProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateQuoteFormValues>({
    resolver: zodResolver(createQuoteSchema),
  });

  const onSubmit = async (data: CreateQuoteFormValues) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: data.clientId,
          projectName: data.projectName,
          notes: data.notes,
          quoteItems: [], // Initialize with empty array
          netPrice: 0,
          taxRate: 0,
          taxAmount: 0,
          deliveryFee: 0,
          totalPrice: 0,
          status: 'draft',
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to create quote');
      }

      // Redirect to the new standalone quote editor
      router.push(`/admin/quotes/${result.quote.id}`);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--brand-white)] rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-[var(--brand-black)] mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={() => {
              reset();
              setIsModalOpen(true);
            }}
            className="block w-full text-center py-3 px-4 bg-[var(--brand-black)] text-white border border-transparent rounded-lg shadow-sm text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create New Quote
          </button>
          
          <Link href="/admin/requests" className="block w-full text-center py-3 px-4 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-[var(--brand-black)] hover:bg-gray-50 transition-colors">
            Review Pending Requests ({pendingCount})
          </Link>
          <Link href="/admin/services" className="block w-full text-center py-3 px-4 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-[var(--brand-black)] hover:bg-gray-50 transition-colors">
            Manage Services & Pricing
          </Link>
          <Link href="/admin/users" className="block w-full text-center py-3 px-4 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-[var(--brand-black)] hover:bg-gray-50 transition-colors">
            Manage Users
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-[var(--brand-black)] mb-4">System Status</h3>
           <div className="flex items-center text-sm text-gray-600 mb-2">
             <div className="h-2 w-2 rounded-full bg-[var(--brand-black)] mr-2"></div>
             Database: Connected
           </div>
           <div className="flex items-center text-sm text-gray-600">
             <div className="h-2 w-2 rounded-full bg-[var(--brand-black)] mr-2"></div>
             Email Service: Active
           </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--brand-black)]">Create New Quote</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Create a new quote directly.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quote Name</label>
                <input
                  {...register('projectName')}
                  placeholder="e.g. Summer Lobby Refresh"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                />
                {errors.projectName && <p className="text-red-600 text-xs mt-1">{errors.projectName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <select
                  {...register('clientId')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                >
                  <option value="">Select a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} ({client.name})
                    </option>
                  ))}
                </select>
                {errors.clientId && <p className="text-red-600 text-xs mt-1">{errors.clientId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Project Notes (Optional)</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                  placeholder="Internal notes about this project..."
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] disabled:opacity-70"
                >
                  {loading ? 'Creating...' : 'Create Quote & Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}