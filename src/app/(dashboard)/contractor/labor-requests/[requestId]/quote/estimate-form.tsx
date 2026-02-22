'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const itemSchema = z.object({
  serviceName: z.string().min(1, 'Service name required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  quantity: z.number().min(0.1, 'Qty must be > 0'),
});

const estimateFormSchema = z.object({
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional(),
  discount: z.number().optional(),
  depositRequired: z.boolean(),
  depositPercentage: z.number().optional(),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

interface EstimateFormProps {
  requestId: string;
}

export default function EstimateForm({ requestId }: EstimateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      items: [{ serviceName: '', description: '', price: 0, quantity: 1 }],
      discount: 0,
      depositRequired: false,
      depositPercentage: 50,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({ control, name: 'items' });
  const watchedDiscount = useWatch({ control, name: 'discount' });
  const watchedDepositRequired = useWatch({ control, name: 'depositRequired' });
  const watchedDepositPercent = useWatch({ control, name: 'depositPercentage' });

  // Calculations
  const subtotal = watchedItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const discountAmount = watchedDiscount || 0;
  const total = Math.max(0, subtotal - discountAmount);
  constRP = watchedDepositRequired ? (total * ((watchedDepositPercent || 0) / 100)) : 0;

  const onSubmit = async (data: EstimateFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare payload with calculated totals
      const payload = {
        items: data.items.map(item => ({
          ...item,
          total: item.price * item.quantity,
        })),
        notes: data.notes,
        subtotal,
        discount: data.discount,
        depositRequired: data.depositRequired,
        depositPercentage: data.depositPercentage,
        total,
      };

      const res = await fetch(`/api/contractor/labor-requests/${requestId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit estimate');
      }

      toast.success('Estimate submitted successfully');
      router.push('/contractor/labor-requests');
      router.refresh();
    } catch (error) {
      toast.error('Error submitting estimate');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* Line Items */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Services / Line Items</label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Service Name</label>
                    <input
                        {...register(`items.${index}.serviceName`)}
                        placeholder="Service Name"
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-[var(--brand-black)]"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Quantity</label>
                    <input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        placeholder="Qty"
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-[var(--brand-black)]"
                        step="0.1"
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Unit Price</label>
                    <input
                        type="number"
                        {...register(`items.${index}.price`, { valueAsNumber: true })}
                        placeholder="Price ($)"
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-[var(--brand-black)]"
                        step="0.01"
                    />
                </div>
                <div className="md:col-span-2 flex items-center justify-end md:justify-start">
                    <p className="font-semibold text-[var(--brand-black)] text-sm">
                        ${((watchedItems?.[index]?.price || 0) * (watchedItems?.[index]?.quantity || 0)).toFixed(2)}
                    </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Description</label>
                <textarea
                    {...register(`items.${index}.description`)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-[var(--brand-black)] resize-none"
                />
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => remove(index)}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors self-end md:self-start"
              title="Remove Item"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={() => append({ serviceName: '', description: '', price: 0, quantity: 1 })}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-black)] hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Line Item
        </button>
        {errors.items && <p className="text-red-600 text-sm">{errors.items.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-8">
        {/* Left Column: Notes */}
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-4">Additional Notes</label>
          <textarea
            {...register('notes')}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-[var(--brand-black)] focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Terms, timeline, exclusions, payment details..."
          />
        </div>

        {/* Right Column: Financials */}
        <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Financial Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-[var(--brand-black)] text-base">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Discount ($)</span>
              <input
                type="number"
                {...register('discount', { valueAsNumber: true })}
                className="w-24 text-right rounded-md border-gray-300 px-2 py-1 text-sm text-[var(--brand-black)]"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="text-lg font-bold text-[var(--brand-black)]">Total Estimate</span>
              <span className="text-lg font-bold text-[var(--brand-black)]">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="depositRequired"
                {...register('depositRequired')}
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-black)] focus:ring-[var(--brand-black)]"
              />
              <label htmlFor="depositRequired" className="text-sm font-medium text-gray-700">Require Upfront Deposit?</label>
            </div>

            {watchedDepositRequired && (
              <div className="pl-7 space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-24">Percentage:</label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      {...register('depositPercentage', { valueAsNumber: true })}
                      className="w-full rounded-md border-gray-300 pl-3 pr-8 py-1 text-sm text-[var(--brand-black)]"
                    />
                    <span className="absolute right-3 top-1.5 text-gray-500 text-xs">%</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 w-24">Deposit Amount:</span>
                  <span className="font-medium text-[var(--brand-black)]">
                    ${(total * ((watchedDepositPercent || 0) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <Link
          href="/contractor/labor-requests"
          className="px-6 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-2.5 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-black)] hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send Estimate
            </>
          )}
        </button>
      </div>
    </form>
  );
}
