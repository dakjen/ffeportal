'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const invoiceSchema = z.object({
  projectName: z.string().min(1, 'Project Name is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  clientId: z.string().nullable().optional(),
  clientEmail: z.string().email('Invalid email').nullable().optional(),
}).refine(data => data.clientId || data.clientEmail, {
  message: "Either select a client or enter an email",
  path: ["clientEmail"],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface ClientOption {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [fetchingClients, setFetchingClients] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: '',
      clientEmail: '',
    }
  });

  const selectedClientId = watch('clientId');

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/contractor/connected-admins');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Failed to fetch clients', error);
      } finally {
        setFetchingClients(false);
      }
    }
    fetchClients();
  }, []);

  // Auto-fill email if client is selected
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setValue('clientEmail', client.email);
      }
    } else {
        setValue('clientEmail', '');
    }
  }, [selectedClientId, clients, setValue]);

  const generatePDF = (data: InvoiceFormValues) => {
    const doc = new jsPDF();
    const brandRed = [113, 5, 5] as [number, number, number]; // #710505
    const lightGray = [240, 240, 240] as [number, number, number];

    // Header Background
    doc.setFillColor(...brandRed);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 180, 25, { align: 'right' });

    // Company Info (Top Left)
    doc.setFontSize(16);
    doc.text('DesignDomain LLC', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Design Services', 20, 28);

    // Invoice Meta
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 180, 50, { align: 'right' });

    // Bill To Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandRed);
    doc.text('Bill To:', 20, 60);
    doc.line(20, 62, 190, 62); // Line

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 70;
    
    if (data.clientId) {
       const client = clients.find(c => c.id === data.clientId);
       doc.text(client?.name || '', 20, yPos);
       yPos += 5;
       if (client?.companyName) {
         doc.text(client.companyName, 20, yPos);
         yPos += 5;
       }
       doc.text(client?.email || '', 20, yPos);
    } else {
       doc.text(data.clientEmail || 'N/A', 20, yPos);
    }

    // Project Details Section
    yPos += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandRed);
    doc.text('Project Details', 20, yPos);
    doc.line(20, yPos + 2, 190, yPos + 2); // Line

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Project:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.projectName, 50, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const splitDescription = doc.splitTextToSize(data.description, 170);
    doc.text(splitDescription, 20, yPos);
    
    const descHeight = splitDescription.length * 5;
    yPos += descHeight + 10;

    // Total Section
    doc.setFillColor(...lightGray);
    doc.rect(120, yPos, 70, 20, 'F'); // Box for total
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total Amount:', 130, yPos + 13);
    doc.setTextColor(...brandRed);
    doc.setFontSize(14);
    doc.text(`$${data.amount.toFixed(2)}`, 185, yPos + 13, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business.', 105, 280, { align: 'center' });
    
    doc.save(`Invoice_${data.projectName.replace(/\s+/g, '_')}.pdf`);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setLoading(true);
    try {
      // 1. Submit to DB
      const res = await fetch('/api/contractor/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to submit invoice');
      }

      // 2. If no client ID selected, trigger PDF download
      if (!data.clientId) {
        generatePDF(data);
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
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
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