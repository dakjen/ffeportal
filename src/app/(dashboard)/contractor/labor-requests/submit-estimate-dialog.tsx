'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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

interface SubmitEstimateDialogProps {
  requestId: string;
  projectName: string;
  requestMessage: string;
  requestDescription: string | null;
}

export default function SubmitEstimateDialog({ 
  requestId, 
  projectName, 
  requestMessage, 
  requestDescription 
}: SubmitEstimateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
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
  const depositAmount = watchedDepositRequired ? (total * ((watchedDepositPercent || 0) / 100)) : 0;

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
      setIsOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error('Error submitting estimate');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-black)] hover:bg-gray-800 transition-colors"
      >
        Submit Estimate <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-lg text-[var(--brand-black)]">Submit Estimate</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* Request Details Section */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Request Details</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><span className="font-medium">Project:</span> {projectName}</p>
              <p><span className="font-medium">Message:</span> &quot;{requestMessage}&quot;</p>
              {requestDescription && <p><span className="font-medium">Description:</span> {requestDescription}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Line Items */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Services / Line Items</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        {...register(`items.${index}.serviceName`)}
                        placeholder="Service Name"
                        className="flex-1 rounded border-gray-300 px-2 py-1 text-sm text-[var(--brand-black)]"
                      />
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        placeholder="Qty"
                        className="w-16 rounded border-gray-300 px-2 py-1 text-sm text-[var(--brand-black)]"
                        step="0.1"
                      />
                      <input
                        type="number"
                        {...register(`items.${index}.price`, { valueAsNumber: true })}
                        placeholder="Price ($)"
                        className="w-24 rounded border-gray-300 px-2 py-1 text-sm text-[var(--brand-black)]"
                        step="0.01"
                      />
                    </div>
                    <textarea
                      {...register(`items.${index}.description`)}
                      placeholder="Description (optional)"
                      rows={1}
                      className="w-full rounded border-gray-300 px-2 py-1 text-sm text-[var(--brand-black)] resize-none"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => remove(index)}
                    className="text-red-400 hover:text-red-600 mt-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => append({ serviceName: '', description: '', price: 0, quantity: 1 })}
                className="text-sm text-[var(--brand-black)] flex items-center gap-1 hover:underline"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
              {errors.items && <p className="text-red-600 text-xs">{errors.items.message}</p>}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              {/* Financials */}
              <div className="flex justify-end flex-col items-end gap-2 text-sm">
                <div className="flex justify-between w-48">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium text-[var(--brand-black)]">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between w-48 items-center">
                  <span className="text-gray-500">Discount ($):</span>
                  <input
                    type="number"
                    {...register('discount', { valueAsNumber: true })}
                    className="w-20 text-right rounded border-gray-300 px-1 py-0.5 text-sm text-[var(--brand-black)]"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex justify-between w-48 border-t border-gray-200 pt-2 mt-1">
                  <span className="font-bold text-[var(--brand-black)]">Total:</span>
                  <span className="font-bold text-[var(--brand-black)]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Deposit Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="depositRequired"
                    {...register('depositRequired')}
                    className="rounded border-gray-300 text-[var(--brand-black)] focus:ring-[var(--brand-black)]"
                  />
                  <label htmlFor="depositRequired" className="text-sm font-medium text-gray-700">Require Deposit?</label>
                </div>

                {watchedDepositRequired && (
                  <div className="ml-6 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Percentage:</label>
                      <div className="relative">
                        <input
                          type="number"
                          {...register('depositPercentage', { valueAsNumber: true })}
                          className="w-16 rounded border-gray-300 pl-2 pr-6 py-1 text-sm text-[var(--brand-black)]"
                        />
                        <span className="absolute right-2 top-1 text-gray-500 text-xs">%</span>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-[var(--brand-black)]">
                      Amount: ${depositAmount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-[var(--brand-black)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-black)]"
                  placeholder="Terms, timeline, exclusion..."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-black)] hover:bg-gray-800 disabled:opacity-50 flex items-center shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Estimate'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}