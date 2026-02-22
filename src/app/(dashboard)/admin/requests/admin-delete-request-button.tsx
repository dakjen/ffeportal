'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminDeleteRequestButtonProps {
  requestId: string;
}

export default function AdminDeleteRequestButton({ requestId }: AdminDeleteRequestButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this request? This will permanently delete the request AND ALL associated quotes, invoices, and documents. This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete request');
      }

      toast.success('Request deleted successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error deleting request');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full"
      title="Delete Request (Admin)"
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
