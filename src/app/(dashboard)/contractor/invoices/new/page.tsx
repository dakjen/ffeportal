'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Download, Plus, Trash2 } from 'lucide-react';

import { toast } from 'sonner';
import { generateClientSideInvoicePdf, ClientOption, ContractorDetails } from '@/utils/client-pdf-generator';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  amount: z.string().min(1, 'Amount is required').refine(val => !isNaN(Number(val)), {
    message: "Amount must be a valid number",
  }),
});

const InvoiceFormInputSchema = z.object({
  invoiceNumber: z.string().optional(),
  dueDate: z.string().optional(),
  projectName: z.string().min(1, 'Project Name is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  clientId: z.string().nullable().optional(),
  clientEmail: z.string().email('Invalid email').nullable().optional(),
}).refine(data => data.clientId || data.clientEmail, {
  message: "Either select a client or enter an email",
  path: ["clientEmail"],
});

type InvoiceFormInput = z.infer<typeof InvoiceFormInputSchema>;

interface ContractorProfile {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  brandColorPrimary: string;
  brandColorSecondary: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormInput>({
    resolver: zodResolver(InvoiceFormInputSchema),
    defaultValues: {
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
      projectName: '',
      items: [{ description: '', amount: '' }],
      clientId: '',
      clientEmail: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedClientId = watch('clientId');
  const watchedItems = watch('items');

  const totalAmount = watchedItems.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  useEffect(() => {
    async function fetchData() {
      try {
        const clientsRes = await fetch('/api/contractor/connected-admins');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData);
        }

        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const profileData: ContractorProfile = await profileRes.json();
          setContractorProfile(profileData);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        toast.error('Failed to load necessary data.');
      } finally {
        setFetchingClients(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
        const client = clients.find(c => c.id === selectedClientId);
        if (client) {
            setValue('clientEmail', client.email || '');
        }
    } else {
        if (!errors.clientEmail) { 
            setValue('clientEmail', '');
        }
    }
  }, [selectedClientId, clients, setValue, errors.clientEmail]);

  const onSubmit = async (data: InvoiceFormInput) => {
    if (!contractorProfile) {
      toast.error('Contractor profile not loaded. Please try again.');
      return;
    }

    const calculatedTotal = data.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const combinedDescription = data.items.map(item => `- ${item.description}: $${Number(item.amount).toFixed(2)}`).join('\n');

    const dbPayload = {
      projectName: data.projectName,
      description: combinedDescription, // Save detailed items into DB description
      amount: calculatedTotal,
      clientId: data.clientId || undefined,
      clientEmail: data.clientEmail || undefined,
    };

    setLoading(true);
    try {
      const res = await fetch('/api/contractor/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbPayload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit invoice');
      }

      // Generate PDF with detailed structure including multiple items
      generateClientSideInvoicePdf(
        {
          ...data,
          items: data.items.map(i => ({ ...i, amount: Number(i.amount) })),
          totalAmount: calculatedTotal
        }, 
        clients, 
        { 
          contractorName: contractorProfile.name, 
          contractorCompany: contractorProfile.companyName, 
          contractorEmail: contractorProfile.email 
        }
      );
      
      toast.success(data.clientId ? 'Invoice saved & PDF downloaded' : 'Invoice saved & PDF downloaded');
      router.push('/contractor/dashboard');

    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Error submitting invoice');
      } else {
        toast.error('Error submitting invoice');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Create Invoice</h1>
        <p className="text-gray-500 mt-1">Generate a detailed invoice for a client or project.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Top Section: Meta Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input
                {...register('invoiceNumber')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                {...register('dueDate')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Project Name</label>
              <input
                {...register('projectName')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-400"
                placeholder="e.g. 123 Main St Renovation"
              />
              {errors.projectName && <p className="text-red-600 text-xs mt-1">{errors.projectName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Client (Admin)</label>
              <select
                {...register('clientId')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900"
                disabled={fetchingClients}
              >
                <option value="">-- Select Client (Optional) --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.companyName ? `${client.companyName} (${client.name})` : client.name}
                  </option>
                ))}
              </select>
              {fetchingClients && <p className="text-xs text-gray-500 mt-1">Loading clients...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Client Email {selectedClientId ? '(Auto-filled)' : '(Required if no client selected)'}</label>
              <input
                type="email"
                {...register('clientEmail')}
                readOnly={!!selectedClientId}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 ${selectedClientId ? 'bg-gray-100' : 'focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]'}`}
                placeholder="client@example.com"
              />
              {errors.clientEmail && <p className="text-red-600 text-xs mt-1">{errors.clientEmail.message}</p>}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--brand-black)]">Line Items</h3>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <input
                      {...register(`items.${index}.description`)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-sm text-gray-900"
                      placeholder="Service or material description"
                    />
                    {errors.items?.[index]?.description && <p className="text-red-600 text-xs mt-1">{errors.items[index].description.message}</p>}
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.amount`)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-sm text-gray-900"
                      placeholder="0.00"
                    />
                    {errors.items?.[index]?.amount && <p className="text-red-600 text-xs mt-1">{errors.items[index].amount.message}</p>}
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-6 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => append({ description: '', amount: '' })}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-red)] hover:text-[#5a0404]"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="flex justify-end pt-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-[var(--brand-black)]">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !contractorProfile}
              className="px-5 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Download className="h-4 w-4" /> Save & Download PDF</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}