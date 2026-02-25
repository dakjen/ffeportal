'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Loader2, Check, User } from 'lucide-react';
import { toast } from 'sonner';

interface AdminResult {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

interface AdminSearchProps {
  existingRequestAdminIds: string[];
}

export default function AdminSearch({ existingRequestAdminIds }: AdminSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/contractor/search-admins?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data);
    } catch (err: unknown) { // Changed to unknown
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to search admins');
      } else {
        toast.error('Failed to search admins');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (adminId: string) => {
    setSendingId(adminId);
    try {
      const res = await fetch('/api/contractor/request-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send request');
      }

      toast.success('Request sent successfully');
      router.refresh();
      // Remove from results or mark as sent
      setResults(prev => prev.filter(a => a.id !== adminId));
    } catch (err: unknown) { // Changed to unknown
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Failed to send request');
      }
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search admins by name, email, or company..."
          className="w-full pl-10 pr-24 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-black)] transition-all text-[var(--brand-black)]"
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[var(--brand-black)] text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {results.map(admin => {
            const isAlreadyRequested = existingRequestAdminIds.includes(admin.id);
            
            return (
              <div key={admin.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--brand-black)]">{admin.companyName || admin.name}</h4>
                    {admin.companyName && <p className="text-sm font-medium text-gray-700">{admin.name}</p>}
                    <p className="text-xs text-gray-500">{admin.email}</p>
                  </div>
                </div>
                
                {isAlreadyRequested ? (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" /> Requested
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendRequest(admin.id)}
                    disabled={sendingId === admin.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[var(--brand-red)] rounded-md hover:bg-[#5a0404] transition-colors disabled:opacity-50"
                  >
                    {sendingId === admin.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Request Connection
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {results.length === 0 && query && !loading && (
        <p className="text-center text-gray-500 py-4">No admins found matching &quot;{query}&quot;</p>
      )}
    </div>
  );
}
