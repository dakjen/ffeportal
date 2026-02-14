'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadCloud } from 'lucide-react';

const newRequestSchema = z.object({
  projectName: z.string().min(1, 'Project Name is required'),
  description: z.string().min(1, 'Description is required'),
});

type NewRequestFormValues = z.infer<typeof newRequestSchema>;

export default function NewRequestPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewRequestFormValues>({
    resolver: zodResolver(newRequestSchema),
  });

  const onSubmit = async (data: NewRequestFormValues) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/client/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to submit request.');
        return;
      }

      router.push('/client/dashboard'); 
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--brand-black)]">Submit New Request</h2>
        <p className="text-gray-500 mt-2">Provide details about your FF&E needs and we'll get back to you with a quote.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="projectName" className="block text-sm font-semibold text-[var(--brand-black)] mb-2">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                placeholder="e.g. Downtown Office Renovation"
                {...register('projectName')}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] transition-colors"
              />
              {errors.projectName && (
                <p className="text-red-500 text-sm mt-1">{errors.projectName.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-[var(--brand-black)] mb-2">
                Description & Requirements
              </label>
              <textarea
                id="description"
                rows={6}
                placeholder="Describe the items you need, quantities, style preferences, timeline..."
                {...register('description')}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] transition-colors resize-y"
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Placeholder for future file upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-not-allowed opacity-60">
               <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-2" />
               <p className="text-sm font-medium text-gray-600">Drag and drop files here, or click to browse</p>
               <p className="text-xs text-gray-400 mt-1">Supports PDF, JPG, PNG (Coming Soon)</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-4 px-6 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 border border-transparent rounded-full shadow-lg text-sm font-semibold text-white bg-[var(--brand-red)] hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)] disabled:opacity-70 transition-all"
              >
                {loading ? 'Submitting Request...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
