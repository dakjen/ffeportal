'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Request {
  id: string;
  clientId: string;
  clientName: string | null;
  clientEmail: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

interface AdminContractorRequestListProps {
  initialRequests: Request[];
}

export default function AdminContractorRequestList({ initialRequests }: AdminContractorRequestListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/approve-contractor-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${action} request`);
      }

      // Update the status in the UI
      setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
      router.refresh(); // Re-fetch server-side requests
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <XCircle className="h-5 w-5 inline mr-2" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No pending contractor requests.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map(request => (
            <div key={request.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="font-semibold text-[var(--brand-black)]">{request.clientName || 'N/A'}</p>
              <p className="text-sm text-gray-600">{request.clientEmail}</p>
              <p className="text-xs text-gray-500 mt-2">Requested: {new Date(request.createdAt).toLocaleDateString()}</p>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAction(request.id, 'approve')}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve
                </button>
                <button
                  onClick={() => handleAction(request.id, 'reject')}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}