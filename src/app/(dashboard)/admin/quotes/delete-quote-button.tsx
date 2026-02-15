'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash } from 'lucide-react';
import clsx from 'clsx';

interface DeleteQuoteButtonProps {
  quoteId: string;
  quoteStatus: string;
}

export default function DeleteQuoteButton({ quoteId, quoteStatus }: DeleteQuoteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = quoteStatus === 'draft';

  const handleDelete = async () => {
    if (!canDelete) {
      setError('Only draft quotes can be deleted.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this draft quote? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete quote');
      }

      // Refresh the current route to reflect the changes
      router.refresh();
    } catch (err: unknown) {
      console.error('Failed to delete quote:', err);
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred during deletion.');
      } else {
        setError('An unexpected error occurred during deletion.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || !canDelete}
        className={clsx(
          "text-red-600 hover:text-red-800",
          (isDeleting || !canDelete) && "opacity-50 cursor-not-allowed"
        )}
        title={canDelete ? "Delete Draft Quote" : "Only draft quotes can be deleted"}
      >
        <Trash className="h-4 w-4" />
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </>
  );
}
