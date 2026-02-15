'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Download } from 'lucide-react';

import { toast } from 'sonner';
import { generateClientSideInvoicePdf, ClientOption, ContractorDetails } from '@/utils/client-pdf-generator';

// Define the Zod schema for the raw input from the form (amount as string)
const InvoiceFormInputSchema = z.object({
  projectName: z.string().min(1, 'Project Name is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required').refine(val => !isNaN(Number(val)), { // Validate it's a number string
    message: "Amount must be a valid number",
  }),
  clientId: z.string().nullable().optional(),
  clientEmail: z.string().email('Invalid email').nullable().optional(),
}).refine(data => data.clientId || data.clientEmail, {
  message: "Either select a client or enter an email",
  path: ["clientEmail"],
});

// The Zod schema for validation and coercion (amount as number)
const invoiceSchema = z.object({
  projectName: z.string().min(1, 'Project Name is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be positive'), // Now directly a number
  clientId: z.string().nullable().optional(),
  clientEmail: z.string().email('Invalid email').nullable().optional(),
});

// The type inferred from the input schema
type InvoiceFormInput = z.infer<typeof InvoiceFormInputSchema>;

// The type inferred from the output schema (after coercion/validation)
type InvoiceFormOutput = z.infer<typeof invoiceSchema>;



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
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormInput>({ // Use InvoiceFormInput here
    resolver: zodResolver(InvoiceFormInputSchema), // Resolve with the input schema
    defaultValues: {
      projectName: '',
      description: '',
      amount: '',
      clientId: '',
      clientEmail: '',
    }
  });

  const selectedClientId = watch('clientId');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch connected admins
        const clientsRes = await fetch('/api/contractor/connected-admins');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData);
        }

        // Fetch contractor's own profile
        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const profileData: ContractorProfile = await profileRes.json();
          setContractorProfile(profileData);
        }

      } catch (error) {
        console.error('Failed to fetch data', error);
        toast.error('Failed to load necessary data.');
      } finally {
        setFetchingClients(false); // Indicates all initial fetches are done
      }
    }
    fetchData();
  }, []);

      // Auto-fill email if client is selected
      useEffect(() => {
          if (selectedClientId) {
              const client = clients.find(c => c.id === selectedClientId);
              if (client) {
                  setValue('clientEmail', client.email || '');
              }
          } else {
              // Only clear if not already manually entered
              if (!errors.clientEmail) { 
                  setValue('clientEmail', '');
              }
          }
      }, [selectedClientId, clients, setValue, errors.clientEmail]);
      
      const onSubmit = async (data: InvoiceFormInput) => { // data is InvoiceFormInput
      // Coerce amount before sending to API or PDF
      const parsedData = invoiceSchema.parse({
        ...data,
        amount: Number(data.amount) // Manually coerce here
      });
  
      if (!contractorProfile) {
        toast.error('Contractor profile not loaded. Please try again.');
        return;
      }
      setLoading(true);
      try {
        // 1. Submit to DB
        const res = await fetch('/api/contractor/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedData), // Use parsedData
        });
  
        if (!res.ok) {
          throw new Error('Failed to submit invoice');
        }
  
        // 2. If no client ID selected, trigger PDF download
        if (!parsedData.clientId) { // Use parsedData
          generateClientSideInvoicePdf(parsedData, clients, { contractorName: contractorProfile.name, contractorCompany: contractorProfile.companyName, contractorEmail: contractorProfile.email }); // Pass parsedData
          toast.success('Invoice saved & PDF downloaded');
        } else {
          toast.success('Invoice sent successfully');
        }
  
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
  
            <div className="max-w-2xl mx-auto space-y-8 bg-gray-50 min-h-screen p-6">
  
              <div>
  
                <h1 className="text-3xl font-bold text-[var(--brand-black)]">Submit Cost / Invoice</h1>
  
                <p className="text-gray-500 mt-1">Create an invoice for a connected admin or generate a PDF.</p>
  
              </div>
  
        
  
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
  
                  {/* Client Selection */}
  
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
  
                              {client.name} {client.companyName ? `(${client.companyName})` : ''}
  
                           </option>
  
                        ))}
  
                     </select>
  
                     {fetchingClients && <p className="text-xs text-gray-500 mt-1">Loading clients...</p>}
  
                  </div>
  
        
  
                  {/* Client Email (if not selected) */}
  
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
  
        
  
                  <div>
  
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
  
                    <input
  
                      {...register('projectName')}
  
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
  
                      placeholder="e.g. Office Renovation - Electrical"
  
                    />
  
                    {errors.projectName && <p className="text-red-600 text-xs mt-1">{errors.projectName.message}</p>}
  
                  </div>
  
        
  
                  <div>
  
                    <label className="block text-sm font-medium text-gray-700">Description</label>
  
                    <textarea
  
                      {...register('description')}
  
                      rows={3}
  
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
  
                      placeholder="Details of work or materials..."
  
                    />
  
                    {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
  
                  </div>
  
        
  
                  <div>
  
                    <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
  
                    <input
  
                      type="number"
  
                      step="0.01"
  
                      {...register('amount')}
  
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] text-gray-900 placeholder-gray-500"
  
                    />
  
                    {errors.amount && <p className="text-red-600 text-xs mt-1">{errors.amount.message}</p>}
  
                  </div>
  
        
  
                  <div className="flex justify-end gap-3 pt-4">
  
                    <button
  
                      type="button"
  
                      onClick={() => router.back()}
  
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
  
                    >
  
                      Cancel
  
                    </button>
  
                    <button
  
                      type="submit"
  
                      disabled={loading || !contractorProfile} // Disable if profile not loaded
  
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] disabled:opacity-50 flex items-center gap-2"
  
                    >
  
                      {loading || !contractorProfile ? (
  
                         <>
  
                            <Loader2 className="h-4 w-4 animate-spin" />
  
                            Processing...
  
                         </>
  
                      ) : !selectedClientId ? (
  
                         <>
  
                            <Download className="h-4 w-4" />
  
                            Save & Download PDF
  
                         </>
  
                      ) : (
  
                         'Submit Invoice'
  
                      )}
  
                    </button>
  
                  </div>
  
                </form>
  
              </div>
  
            </div>
  
          );
  
        }
  
        