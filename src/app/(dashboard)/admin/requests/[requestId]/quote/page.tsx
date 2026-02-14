'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Plus } from 'lucide-react';

// --- Schemas ---
const quoteItemSchema = z.object({
  id: z.string().optional(),
  serviceName: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0), // Total Price
  unitPrice: z.coerce.number().min(0), // Price per unit/hour
  quantity: z.coerce.number().min(0.1), // Quantity or Hours
  pricingType: z.enum(['hourly', 'flat']).optional(),
});

const quoteFormSchema = z.object({
  quoteItems: z.array(quoteItemSchema),
  status: z.enum(['draft', 'sent', 'approved', 'revised']).default('draft'),
});

type QuoteItem = z.infer<typeof quoteItemSchema>;
type QuoteFormValues = z.infer<typeof quoteFormSchema>;

// --- Sortable Item Component ---
interface SortableItemProps {
  item: QuoteItem;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof QuoteItem, value: any) => void;
}

function SortableItem({ item, onRemove, onUpdate }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleQuantityChange = (qty: number) => {
    onUpdate(item.id!, 'quantity', qty);
    onUpdate(item.id!, 'price', qty * item.unitPrice);
  };

  const handleUnitPriceChange = (price: number) => {
    onUpdate(item.id!, 'unitPrice', price);
    onUpdate(item.id!, 'price', item.quantity * price);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col p-4 border rounded-md bg-white shadow-sm mb-2 gap-3"
    >
      <div className="flex items-center justify-between cursor-move" {...attributes} {...listeners}>
        <div className="flex items-center gap-2">
          {item.id?.startsWith('custom-') ? (
            <input
              type="text"
              value={item.serviceName}
              onChange={(e) => onUpdate(item.id!, 'serviceName', e.target.value)}
              placeholder="Custom Service Name"
              className="font-semibold text-[var(--brand-black)] border-b border-gray-300 focus:border-[var(--brand-red)] outline-none"
            />
          ) : (
            <span className="font-semibold text-[var(--brand-black)]">{item.serviceName}</span>
          )}
          {item.pricingType && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.pricingType === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {item.pricingType === 'hourly' ? 'Hourly' : 'Flat'}
            </span>
          )}
        </div>
        <button type="button" onClick={() => onRemove(item.id!)} className="text-red-500 hover:text-red-700 text-xs font-medium">
          Remove
        </button>
      </div>
      
      <div className="flex flex-col gap-2">
        <textarea
          value={item.description || ''}
          onChange={(e) => onUpdate(item.id!, 'description', e.target.value)}
          placeholder="Description"
          className="w-full text-sm text-gray-600 resize-none border border-gray-200 rounded p-2 focus:outline-none focus:border-[var(--brand-red)]"
          rows={2}
        />
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium block mb-1">
              {item.pricingType === 'hourly' ? 'Hours' : 'Quantity'}
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              className="w-full text-sm p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-[var(--brand-black)]"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Unit Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full text-sm p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-[var(--brand-black)]"
            />
          </div>
          <div className="flex-1 text-right pb-2">
            <span className="text-xs text-gray-500 block">Total</span>
            <span className="font-bold text-[var(--brand-black)]">${item.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuoteBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  interface RequestWithQuoteInfo {
    id: string;
    projectName: string;
    clientName: string;
    clientCompanyName?: string; // Add clientCompanyName
    currentQuoteId?: string;
    currentQuoteStatus?: string;
    // Add other request fields as needed by the UI
  }

  const [request, setRequest] = useState<RequestWithQuoteInfo | null>(null); // Update type
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingQuote, setSavingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedQuoteItems, setSelectedQuoteItems] = useState<QuoteItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0); // State for tax rate percentage (e.g., 0.05 for 5%)
  const [deliveryFee, setDeliveryFee] = useState<number>(0); // State for flat delivery fee

  // Form handling
  const { handleSubmit, setValue } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      quoteItems: [],
      status: 'draft',
    },
  });

  // Fetch request details and services
  useEffect(() => {
    async function fetchData() {
      try {
        const [reqRes, servicesRes] = await Promise.all([
          fetch(`/api/admin/requests/${requestId}`),
          fetch('/api/admin/services')
        ]);

        if (!reqRes.ok) throw new Error('Failed to fetch request details');
        if (!servicesRes.ok) throw new Error('Failed to fetch services');

        const reqData = await reqRes.json();
        const servicesData = await servicesRes.json();

        // Fetch current quote data to get its ID and status - This API call was incorrect and is now removed.
        // It was making a GET request to /api/admin/quotes/[requestId] which expected a quoteId.
        // The fetchExistingQuote useEffect handles fetching the actual quote.
        let currentQuoteId: string | undefined;
        let currentQuoteStatus: string | undefined;
        // The logic for populating currentQuoteId and currentQuoteStatus will now be handled
        // by the fetchExistingQuote useEffect once the quote is successfully loaded.

        setRequest({
          ...reqData.request,
          currentQuoteId,
          currentQuoteStatus,
        });
        setAvailableServices(servicesData.services);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [requestId]);

  // Update form with selected quote items
  useEffect(() => {
    setValue('quoteItems', selectedQuoteItems);
  }, [selectedQuoteItems, setValue]);

  // Fetch existing draft quote if available
  useEffect(() => {
    async function fetchExistingQuote() {
      try {
        const response = await fetch(`/api/admin/requests/${requestId}/quote`); // Calls the new API route
        if (response.ok) {
          const data = await response.json();
          if (data.quote) {
            setSelectedQuoteItems(data.quote.quoteItems.map((item: any) => ({
              ...item,
              price: parseFloat(item.price),
              unitPrice: parseFloat(item.unitPrice),
              quantity: parseFloat(item.quantity),
            })));
            setTaxRate(parseFloat(data.quote.taxRate));
            setDeliveryFee(parseFloat(data.quote.deliveryFee));
            // Ensure values are numbers before setting state
            setTaxRate(data.quote.taxRate ? parseFloat(data.quote.taxRate) : 0);
            setDeliveryFee(data.quote.deliveryFee ? parseFloat(data.quote.deliveryFee) : 0);
            setValue('status', data.quote.status); // Set status if loading draft
          }
        } else if (response.status === 404) {
          // No existing quote, which is fine for a new quote being built
          console.log('No existing draft quote found for this request. Starting fresh.');
        } else {
          throw new Error(`Failed to fetch existing quote: ${response.statusText}`);
        }
      } catch (err: any) {
        console.error('Failed to fetch existing quote:', err.message);
        setError(prev => prev ? prev + "\n" + err.message : err.message); // Append error
      }
    }
    fetchExistingQuote();
  }, [requestId, setValue]); // Dependency on requestId and setValue, ensuring setValue stability

  // Calculate net total, tax amount, and final total
  const { netPrice, taxAmount, finalTotalPrice } = useMemo(() => {
    const calculatedNetPrice = selectedQuoteItems.reduce((sum, item) => sum + item.price, 0);
    const calculatedTaxAmount = calculatedNetPrice * taxRate;
    const calculatedFinalTotalPrice = calculatedNetPrice + calculatedTaxAmount + deliveryFee;
    return {
      netPrice: calculatedNetPrice,
      taxAmount: calculatedTaxAmount,
      finalTotalPrice: calculatedFinalTotalPrice,
    };
  }, [selectedQuoteItems, taxRate, deliveryFee]);

  // DND Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setSelectedQuoteItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleAddService(service: any) {
    const newId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const unitPrice = parseFloat(service.price);
    const quantity = 1;
    
    const newItem: QuoteItem = {
      id: newId,
      serviceName: service.name,
      description: service.description,
      unitPrice: unitPrice,
      quantity: quantity,
      price: unitPrice * quantity,
      pricingType: service.pricingType,
    };
    
    setSelectedQuoteItems((prev) => [...prev, newItem]);
  }

  function handleRemoveService(id: string) {
    setSelectedQuoteItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleUpdateServiceItem(id: string, field: keyof QuoteItem, value: any) {
    setSelectedQuoteItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  const onSubmit = async (values: QuoteFormValues) => {
    setSavingQuote(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId,
          quoteItems: selectedQuoteItems,
          status: values.status,
          netPrice: netPrice, // Add netPrice
          taxRate: taxRate, // Add taxRate
          taxAmount: taxAmount, // Add taxAmount
          deliveryFee: deliveryFee, // Add deliveryFee
          totalPrice: finalTotalPrice, // Use finalTotalPrice
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save quote');
      }

      router.push(`/admin/requests`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while saving the quote.');
    } finally {
      setSavingQuote(false);
    }
  };

  function handleAddCustomItem() {
    const newId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newItem: QuoteItem = {
      id: newId,
      serviceName: 'Custom Service', // Default name
      description: '',
      unitPrice: 0,
      quantity: 1,
      price: 0,
      pricingType: 'flat', // Default type
    };
    setSelectedQuoteItems((prev) => [...prev, newItem]);
  }

  const handleDeleteQuote = async () => {
    // Assuming request.currentQuoteId is available
    if (!request || !request.currentQuoteId || !confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    setSavingQuote(true); // Reusing savingQuote state for any mutation
    setError(null);
    try {
      const response = await fetch(`/api/admin/quotes/${request.currentQuoteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete quote');
      }

      router.push(`/admin/requests`); // Redirect after successful deletion
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while deleting the quote.');
    } finally {
      setSavingQuote(false);
    }
  };

  if (loading) return <div className="p-6">Loading details...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--brand-black)]">Build Quote</h2>
          <p className="text-gray-500">Project: {request.projectName} | Client: {request.clientCompanyName || request.clientName}</p>
        </div>
        <div className="flex gap-3"> {/* New wrapper for buttons */}
          {request?.currentQuoteId && request?.currentQuoteStatus !== 'sent' && (
            <button
              type="button"
              onClick={handleDeleteQuote}
              disabled={savingQuote}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Delete Quote
            </button>
          )}
          <Link
            href="/admin/pricing"
            target="_blank"
            className="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-[var(--brand-black)] shadow-sm hover:bg-gray-300 transition-colors"
          >
            Price This
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Services */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--brand-black)]">Service Catalog</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {availableServices.length === 0 ? (
              <p className="text-sm text-gray-500">No services found. Add them in Services & Pricing.</p>
            ) : (
              availableServices.map((service) => (
                <div key={service.id} className="p-4 border rounded-lg bg-white shadow-sm hover:border-[var(--brand-red)] transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-[var(--brand-black)]">{service.name}</h4>
                    <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">
                      ${parseFloat(service.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{service.description}</p>
                  <button
                    type="button"
                    onClick={() => handleAddService(service)}
                    className="w-full py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded hover:bg-[var(--brand-black)] hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add to Quote
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={handleAddCustomItem}
            className="w-full py-2 text-sm font-medium bg-gray-100 text-[var(--brand-black)] rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 mt-4"
          >
            <Plus className="h-4 w-4" /> Add Custom Item
          </button>
        </div>

        {/* Quote Builder Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-[var(--brand-black)]">Quote Items ({selectedQuoteItems.length})</h3>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 min-h-[300px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedQuoteItems.map(item => item.id!)} strategy={verticalListSortingStrategy}>
                {selectedQuoteItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                    <p>Select services from the catalog to build your quote.</p>
                  </div>
                ) : (
                  selectedQuoteItems.map((item) => (
                    <SortableItem
                      key={item.id!}
                      item={item}
                      onRemove={handleRemoveService}
                      onUpdate={handleUpdateServiceItem}
                    />
                  ))
                )}
              </SortableContext>
            </DndContext>
          </div>

          {/* Pricing Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            <h3 className="font-semibold text-[var(--brand-black)] mb-3">Pricing Summary</h3>

            {/* Net Price (Sum of Items) */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Items Subtotal:</span>
              <span className="font-bold text-[var(--brand-black)]">${netPrice.toFixed(2)}</span>
            </div>

            {/* Tax Rate Input */}
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="taxRate" className="text-gray-500">Tax Rate (%):</label>
              <input
                id="taxRate"
                type="number"
                min="0"
                step="0.01"
                value={taxRate * 100} // Display as percentage
                onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
                className="w-24 p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-right text-[var(--brand-black)]"
              />
            </div>

            {/* Calculated Tax Amount */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Sales Tax:</span>
              <span className="font-bold text-[var(--brand-black)]">${taxAmount.toFixed(2)}</span>
            </div>

            {/* Delivery Fee Input */}
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="deliveryFee" className="text-gray-500">Delivery Fee ($):</label>
              <input
                id="deliveryFee"
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                className="w-24 p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-right text-[var(--brand-black)]"
              />
            </div>

            {/* Final Total Price */}
            <div className="pt-4 mt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-lg font-bold text-[var(--brand-black)]">Total Quote Value</span>
              <p className="text-3xl font-bold text-[var(--brand-black)]">${finalTotalPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex justify-between items-center">
            <div className="flex gap-3">
              <Link href="/admin/requests" className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => { setValue('status', 'draft'); handleSubmit(onSubmit)(); }}
                disabled={savingQuote}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => { setValue('status', 'sent'); handleSubmit(onSubmit)(); }}
                disabled={savingQuote || selectedQuoteItems.length === 0}
                className="px-5 py-2.5 bg-[var(--brand-red)] text-white rounded-md text-sm font-medium hover:bg-[#5a0404]"
              >
                Send Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}