'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const quoteNotesSchema = z.object({
  notes: z.string().min(1, 'Notes cannot be empty'),
});

type QuoteNotesFormValues = z.infer<typeof quoteNotesSchema>;

interface QuoteNotesFormProps {
  quoteId: string;
  onNotesSubmitted: () => void;
}

export function QuoteNotesForm({ quoteId, onNotesSubmitted }: QuoteNotesFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteNotesFormValues>({
    resolver: zodResolver(quoteNotesSchema),
  });

  const onSubmit = async (data: QuoteNotesFormValues) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/client/quotes/${quoteId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: data.notes }),
      });

      if (!res.ok) {
        throw new Error('Failed to add notes');
      }

      toast.success('Notes added successfully!');
      reset();
      onNotesSubmitted(); // Notify parent to refresh or update UI
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Error adding notes');
      } else {
        toast.error('Error adding notes');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label htmlFor="notes" className="sr-only">Your Notes</label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] resize-y"
          placeholder="Type your notes or revision requests here..."
        />
        {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes.message}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-black)] hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Notes'}
      </button>
    </form>
  );
}
