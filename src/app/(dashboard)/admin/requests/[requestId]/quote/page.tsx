'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import clsx from 'clsx'; // Import clsx
import { Plus } from 'lucide-react';

// --- Schemas ---
const quoteItemSchema = z.object({
  id: z.string().optional(),
  serviceName: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.number().min(0).optional(), // Changed to z.number().optional()
  unitPrice: z.number().min(0).optional(), // Changed to z.number().optional()
  quantity: z.number().min(0.1).optional(), // Changed to z.number().optional()
  pricingType: z.enum(['hourly', 'flat']).optional(),
});

const quoteFormSchema = z.object({
  quoteItems: z.array(quoteItemSchema),
  status: z.enum(['draft', 'sent', 'approved', 'revised']), // Removed .default('draft')
});

type QuoteItem = z.infer<typeof quoteItemSchema>;
// Explicitly define QuoteFormValues for better type compatibility with useForm
type QuoteFormValues = {
  quoteItems: Array<{
    id?: string;
    serviceName: string;
    description?: string;
    price?: number;
    unitPrice?: number;
    quantity?: number;
    pricingType?: 'hourly' | 'flat';
  }>;
  status: 'draft' | 'sent' | 'approved' | 'revised';
};


// --- Constants ---
const TAX_RATES: Record<string, number> = {
  // Major Cities
  "New York City, NY": 0.08875,
  "Buffalo, NY": 0.0875,
  "Rochester, NY": 0.08,
  "Albany, NY": 0.08,
  "Syracuse, NY": 0.08,
  "Los Angeles, CA": 0.095,
  "San Francisco, CA": 0.08625,
  "San Diego, CA": 0.0775,
  "Sacramento, CA": 0.0875,
  "San Jose, CA": 0.09375,
  "Houston, TX": 0.0825,
  "Dallas, TX": 0.0825,
  "Austin, TX": 0.0825,
  "San Antonio, TX": 0.0825,
  "Chicago, IL": 0.1025,
  "Springfield, IL": 0.0975,
  "Peoria, IL": 0.1,
  
  // States
  "Alabama": 0.04,
  "Alaska": 0,
  "Arizona": 0.056,
  "Arkansas": 0.065,
  "California": 0.0725,
  "Colorado": 0.029,
  "Connecticut": 0.0635,
  "Delaware": 0,
  "Florida": 0.06,
  "Georgia": 0.04,
  "Hawaii": 0.04,
  "Idaho": 0.06,
  "Illinois": 0.0625,
  "Indiana": 0.07,
  "Iowa": 0.06,
  "Kansas": 0.065,
  "Kentucky": 0.06,
  "Louisiana": 0.05,
  "Maine": 0.055,
  "Maryland": 0.06,
  "Massachusetts": 0.0625,
  "Michigan": 0.06,
  "Minnesota": 0.06875,
  "Mississippi": 0.07,
  "Missouri": 0.04225,
  "Montana": 0,
  "Nebraska": 0.055,
  "Nevada": 0.046,
  "New Hampshire": 0,
  "New Jersey": 0.06625,
  "New Mexico": 0.05,
  "New York": 0.04,
  "North Carolina": 0.0475,
  "North Dakota": 0.05,
  "Ohio": 0.0575,
  "Oklahoma": 0.045,
  "Oregon": 0,
  "Pennsylvania": 0.06,
  "Rhode Island": 0.07,
  "South Carolina": 0.06,
  "South Dakota": 0.045,
  "Tennessee": 0.07,
  "Texas": 0.0625,
  "Utah": 0.047,
  "Vermont": 0.06,
  "Virginia": 0.043,
  "Washington": 0.065,
  "Washington DC": 0.06,
  "West Virginia": 0.06,
  "Wisconsin": 0.05,
  "Wyoming": 0.04,
};

// --- Sortable Item Component ---
interface SortableItemProps {
  item: QuoteItem;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof QuoteItem, value: string | number | undefined) => void;
  isEditable: boolean;
}

function SortableItem({ item, onRemove, onUpdate, isEditable }: SortableItemProps) {
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
    onUpdate(item.id!, 'price', qty * (item.unitPrice || 0)); // Add || 0
  };

  const handleUnitPriceChange = (price: number) => {
    onUpdate(item.id!, 'unitPrice', price);
    onUpdate(item.id!, 'price', (item.quantity || 0) * price); // Add || 0
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col p-4 border rounded-md bg-white shadow-sm mb-2 gap-3"
    >
      <div className={clsx("flex items-center justify-between", isEditable && "cursor-move")} {...(isEditable ? { ...attributes, ...listeners } : {})}>
        <div className="flex items-center gap-2">
          {item.id?.startsWith('custom-') && isEditable ? (
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
        {isEditable && (
          <button type="button" onClick={() => onRemove(item.id!)} className="text-red-500 hover:text-red-700 text-xs font-medium">
            Remove
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-2">
        {isEditable ? (
          <textarea
            value={item.description || ''}
            onChange={(e) => onUpdate(item.id!, 'description', e.target.value)}
            placeholder="Description"
            className="w-full text-sm text-gray-600 resize-none border border-gray-200 rounded p-2 focus:outline-none focus:border-[var(--brand-red)]"
            rows={2}
          />
        ) : (
          <p className="text-sm text-gray-600">{item.description || '-'}</p>
        )}
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium block mb-1">
              {item.pricingType === 'hourly' ? 'Hours' : 'Quantity'}
            </label>
            {isEditable ? (
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                className="w-full text-sm p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-[var(--brand-black)]"
              />
            ) : (
              <p className="w-full text-sm p-1.5 text-[var(--brand-black)]">{(item.quantity || 0).toFixed(2)}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Unit Price ($)
            </label>
            {isEditable ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full text-sm p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-[var(--brand-black)]"
              />
            ) : (
              <p className="w-full text-sm p-1.5 text-[var(--brand-black)]">${(item.unitPrice || 0).toFixed(2)}</p>
            )}
          </div>
          <div className="flex-1 text-right pb-2">
            <span className="text-xs text-gray-500 block">Total</span>
            <span className="font-bold text-[var(--brand-black)]">${(item.price || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  pricingType: 'hourly' | 'flat';
}

export default function QuoteBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  interface RequestWithQuoteInfo {
    id: string;
    projectName: string;
    clientName: string;
    clientCompanyName?: string;
    currentQuoteId?: string;
    currentQuoteStatus?: string;
    description?: string;
    status?: string;
    createdAt?: string;
  }

  const [request, setRequest] = useState<RequestWithQuoteInfo | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingQuote, setSavingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedQuoteItems, setSelectedQuoteItems] = useState<QuoteItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string>('custom'); // State for location dropdown

  const isQuoteEditable = !request?.currentQuoteStatus || request?.currentQuoteStatus === 'draft';

  // Form handling
  const { handleSubmit, setValue } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      quoteItems: [],
      status: 'draft',
    } as QuoteFormValues, // Explicit cast
  });

  // Handle Location Change
  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    if (location !== 'custom' && TAX_RATES[location] !== undefined) {
      setTaxRate(TAX_RATES[location]);
    }
  };

  // Handle Manual Tax Rate Change
  const handleManualTaxRateChange = (rate: number) => {
    setTaxRate(rate);
    // Only set to custom if the new rate doesn't match the selected location's rate (allowing for tiny floating point diffs)
    if (selectedLocation !== 'custom' && Math.abs(rate - (TAX_RATES[selectedLocation] || 0)) > 0.00001) {
       setSelectedLocation('custom');
    }
  };

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

        setRequest({
          ...reqData.request,
          currentQuoteId: reqData.quote?.id, // Get quote id from requestData if it exists
          currentQuoteStatus: reqData.quote?.status, // Get quote status from requestData if it exists
        });
        setAvailableServices(servicesData.services);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [requestId, setValue]);

  useEffect(() => {
    setValue('quoteItems', selectedQuoteItems);
  }, [selectedQuoteItems, setValue]);

  // Fetch existing draft quote if available
  useEffect(() => {
    async function fetchExistingQuote() {
      try {
        const response = await fetch(`/api/admin/requests/${requestId}/quote`);
        if (response.ok) {
          const data = await response.json();
          if (data.quote) {
            setSelectedQuoteItems(data.quote.quoteItems.map((item: QuoteItem) => ({
              ...item,
              price: parseFloat(String(item.price || '0')), // Add || '0'
              unitPrice: parseFloat(String(item.unitPrice || '0')), // Add || '0'
              quantity: parseFloat(String(item.quantity || '0')), // Add || '0'
            })));
            setTaxRate(parseFloat(String(data.quote.taxRate || '0'))); // Add || '0'
            setDeliveryFee(parseFloat(String(data.quote.deliveryFee || '0'))); // Add || '0'
            // Ensure values are numbers before setting state (redundant after above, but harmless)
            // setTaxRate(data.quote.taxRate ? parseFloat(data.quote.taxRate) : 0);
            // setDeliveryFee(data.quote.deliveryFee ? parseFloat(data.quote.deliveryFee) : 0);
            setValue('status', data.quote.status);
          }
        } else if (response.status === 404) {
          console.log('No existing draft quote found for this request. Starting fresh.');
        } else {
          throw new Error(`Failed to fetch existing quote: ${response.statusText}`);
        }
      } catch (err: unknown) {
        if (err instanceof Error) console.error('Failed to fetch existing quote:', err.message);
        if (err instanceof Error) setError(prev => prev ? prev + "\n" + err.message : err.message);
      }
    }
    fetchExistingQuote();
  }, [requestId, setValue]);

  const { netPrice, taxAmount, finalTotalPrice } = useMemo(() => {
    const calculatedNetPrice = selectedQuoteItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const calculatedTaxAmount = calculatedNetPrice * taxRate;
    const calculatedFinalTotalPrice = calculatedNetPrice + calculatedTaxAmount + deliveryFee;
    return {
      netPrice: calculatedNetPrice,
      taxAmount: calculatedTaxAmount,
      finalTotalPrice: calculatedFinalTotalPrice,
    };
  }, [selectedQuoteItems, taxRate, deliveryFee]);

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

  function handleDragEnd(event: DragEndEvent) {
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

  function handleAddService(service: Service) {
    const newId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const unitPrice = parseFloat(service.price || '0'); // Add || '0'
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

  function handleUpdateServiceItem(id: string, field: keyof QuoteItem, value: string | number | undefined) {
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
          netPrice: netPrice,
          taxRate: taxRate,
          taxAmount: taxAmount,
          deliveryFee: deliveryFee,
          totalPrice: finalTotalPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save quote');
      }

      router.push(`/admin/requests`);
    } catch (err: unknown) {
        if (err instanceof Error) setError(err.message || 'An unexpected error occurred while saving the quote.');
    } finally {
      setSavingQuote(false);
    }
  };

  function handleAddCustomItem() {
    const newId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newItem: QuoteItem = {
      id: newId,
      serviceName: '', // Initialize as empty string
      description: '',
      unitPrice: 0,
      quantity: 1,
      price: 0,
      pricingType: 'flat',
    };
    setSelectedQuoteItems((prev) => [...prev, newItem]);
  }

  const handleDeleteQuote = async () => {
    if (!request || !request.currentQuoteId || !confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    setSavingQuote(true);
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

      router.push(`/admin/requests`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || 'An unexpected error occurred while deleting the quote.');
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

      {/* Request Details Box */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-[var(--brand-black)] mb-2">Request Details</h3>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{request.description || "No description provided."}</p>
        <div className="mt-4 flex gap-6 text-sm text-gray-500">
            <span><strong>Submitted:</strong> {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-'}</span>
            <span><strong>Status:</strong> <span className="capitalize">{request.status}</span></span>
        </div>
      </div>

      {/* Service Catalog - Moved to a top section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-[var(--brand-black)]">Service Catalog</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"> {/* Responsive grid for services */}
          {availableServices.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-full">No services found. Add them in Services & Pricing.</p>
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
                  disabled={!isQuoteEditable} // Added disabled
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
          onClick={() => handleAddCustomItem()} // Changed to arrow function
          disabled={!isQuoteEditable} // Added disabled
          className="w-full py-2 text-sm font-medium bg-gray-100 text-[var(--brand-black)] rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 mt-4"
        >
          <Plus className="h-4 w-4" /> Add Custom Item
        </button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> {/* Main 2-column layout */}
        {/* Left Column: Quote Builder Canvas (Items) */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--brand-black)]">Quote Items ({selectedQuoteItems.length})</h3>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 min-h-[300px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedQuoteItems.map(item => item.id!)} strategy={verticalListSortingStrategy}>
                {selectedQuoteItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                    <p>Select services from the catalog or add custom items to build your quote.</p>
                  </div>
                ) : (
                  selectedQuoteItems.map((item) => (
                    <SortableItem
                      key={item.id!}
                      item={item}
                      onRemove={handleRemoveService}
                      onUpdate={handleUpdateServiceItem}
                      isEditable={isQuoteEditable}
                    />
                  ))
                )}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Right Column: Quote Details (Pricing Summary & Actions) */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--brand-black)]">Quote Details</h3>

          {/* Pricing Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            <h4 className="font-semibold text-[var(--brand-black)] mb-3">Financial Summary</h4>

            {/* Net Price (Sum of Items) */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Items Subtotal:</span>
              <span className="font-bold text-[var(--brand-black)]">${netPrice.toFixed(2)}</span>
            </div>

            {/* Contract Location Dropdown */}
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="contractLocation" className="text-gray-500">Contract Location:</label>
              <select
                id="contractLocation"
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled={!isQuoteEditable}
                className="w-48 p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-[var(--brand-black)] bg-white"
              >
                <option value="custom">Custom / Manual</option>
                <optgroup label="Major Cities">
                  {Object.keys(TAX_RATES).filter(key => key.includes(',')).sort().map(city => (
                    <option key={city} value={city}>{city} ({(TAX_RATES[city] * 100).toFixed(3)}%)</option>
                  ))}
                </optgroup>
                <optgroup label="States">
                  {Object.keys(TAX_RATES).filter(key => !key.includes(',')).sort().map(state => (
                    <option key={state} value={state}>{state} ({(TAX_RATES[state] * 100).toFixed(3)}%)</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Tax Rate Input */}
            <div className="flex justify-between items-center text-sm">
              <label htmlFor="taxRate" className="text-gray-500">Tax Rate (%):</label>
              <input
                id="taxRate"
                type="number"
                min="0"
                step="0.001"
                value={Number((taxRate * 100).toFixed(3))} // Display as percentage
                onChange={(e) => handleManualTaxRateChange(parseFloat(e.target.value) / 100 || 0)}
                className="w-24 p-1.5 border border-gray-200 rounded focus:border-[var(--brand-red)] outline-none text-right text-[var(--brand-black)]"
                readOnly={!isQuoteEditable}
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
                readOnly={!isQuoteEditable} // Added readOnly
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
                disabled={savingQuote || !isQuoteEditable}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => { setValue('status', 'sent'); handleSubmit(onSubmit)(); }}
                disabled={savingQuote || selectedQuoteItems.length === 0 || !isQuoteEditable}
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
