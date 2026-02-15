'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, UserPlus, XCircle } from 'lucide-react';

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface AdminSearchResult {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

interface SearchAdminsFormProps {
  clientId: string;
}

export default function SearchAdminsForm({ clientId }: SearchAdminsFormProps) {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [admins, setAdmins] = useState<AdminSearchResult[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
  });

  const onSearch = async (data: SearchFormValues) => {
    setLoading(true);
    setSearchError('');
    setAdmins([]);
    setSelectedAdminId(null);
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/client/search-admins?query=${encodeURIComponent(data.query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to search for admins');
      }

      const result = await res.json();
      setAdmins(result.admins);
      if (result.admins.length === 0) {
        setSearchError('No administrators found matching your query.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSearchError(err.message);
      } else {
        setSearchError('An unexpected error occurred during search.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRequestLink = async (adminId: string) => {
    setLoading(true);
    setRequestError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/client/request-contractor-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, clientId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send request');
      }

      setSuccessMessage('Request sent successfully! The administrator will review your request.');
      setSelectedAdminId(null); // Clear selection after sending
      setAdmins([]); // Clear search results
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRequestError(err.message);
      } else {
        setRequestError('An unexpected error occurred while sending the request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSearch)} className="flex gap-4">
        <div className="flex-grow">
          <input
            {...register('query')}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
            placeholder="Search admins by name or company name..."
          />
          {errors.query && <p className="text-red-600 text-xs mt-1">{errors.query.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? 'Searching...' : <><Search className="h-4 w-4 mr-2" /> Search</>}
        </button>
      </form>

      {searchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <XCircle className="h-5 w-5 inline mr-2" />
          <span className="block sm:inline">{searchError}</span>
        </div>
      )}

      {requestError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <XCircle className="h-5 w-5 inline mr-2" />
          <span className="block sm:inline">{requestError}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {admins.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--brand-black)]">Search Results</h3>
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-100">
              <div>
                <p className="font-medium text-[var(--brand-black)]">{admin.companyName || admin.name}</p> {/* Display companyName, fallback to name */}
                <p className="text-sm text-gray-500">{admin.email}</p>
              </div>
              <button
                onClick={() => onRequestLink(admin.id)}
                disabled={loading || selectedAdminId === admin.id}
                className="px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-beige)] hover:bg-[var(--brand-beige-dark)] disabled:opacity-50 flex items-center justify-center"
              >
                {loading && selectedAdminId === admin.id ? 'Sending...' : <><UserPlus className="h-4 w-4 mr-2" /> Request Link</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}