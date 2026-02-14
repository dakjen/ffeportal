// src/app/(dashboard)/admin/pricing/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Save } from 'lucide-react'; // Example icons

// Define a schema for creating new pricing entries
const createPricingEntrySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  internalCostInput: z.coerce.number().min(0).optional(),
  marginInput: z.coerce.number().min(0).optional(),
  pricingType: z.enum(['hourly', 'flat']).default('flat'),
  roundOption: z.enum(['none', 'up', 'down']).default('none'),
  description: z.string().optional(),
});

// Define a schema for updating pricing entries (all fields optional)
const updatePricingEntrySchema = createPricingEntrySchema.partial().extend({
  id: z.string().min(1, 'Entry ID is required'),
  calculatedPrice: z.coerce.number().min(0).optional(), // Can be updated
});

type PricingEntryFormValues = z.infer<typeof createPricingEntrySchema>;
type UpdatePricingEntryFormValues = z.infer<typeof updatePricingEntrySchema>;

export default function AdminPricingPage() {
  const [pricingEntries, setPricingEntries] = useState<any[]>([]); // Renamed from services
  const [loading, setLoading] = useState(true);
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null); // Renamed from savingServiceId
  const [error, setError] = useState<string | null>(null);

  // States for the calculation (per-entry or for a selected one)
  const [editStates, setEditStates] = useState<{
    [entryId: string]: { // Renamed from serviceId
      internalCostInput?: number; // Renamed from internalCost
      marginInput?: number; // Renamed from margin
      roundOption: 'none' | 'up' | 'down';
    };
  }>({});

  // States for "Add New Pricing Entry" form
  const [newEntryFormName, setNewEntryFormName] = useState('');
  const [newEntryFormInternalCost, setNewEntryFormInternalCost] = useState<number | undefined>(0);
  const [newEntryFormMargin, setNewEntryFormMargin] = useState<number | undefined>(0);
  const [newEntryFormRoundOption, setNewEntryFormRoundOption] = useState<'none' | 'up' | 'down'>('none');
  const [newEntryFormPricingType, setNewEntryFormPricingType] = useState<'hourly' | 'flat'>('flat');
  const [newEntryFormDescription, setNewEntryFormDescription] = useState<string | undefined>('');
  const [addingNewEntry, setAddingNewEntry] = useState(false);
  const [newEntryError, setNewEntryError] = useState<string | null>(null);


  useEffect(() => {
    fetchPricingEntries(); // Renamed
  }, []);

  const fetchPricingEntries = async () => { // Renamed
    try {
      const res = await fetch('/api/admin/pricing-entries'); // New API endpoint
      if (res.ok) {
        const data = await res.json();
        setPricingEntries(data.pricingEntries); // Renamed
        // Initialize edit states
        const initialEditStates: typeof editStates = {};
        data.pricingEntries.forEach((entry: any) => { // Renamed from service
          initialEditStates[entry.id] = {
            internalCostInput: parseFloat(entry.internalCostInput) || 0, // Renamed
            marginInput: parseFloat(entry.marginInput) || 0,             // Renamed
            roundOption: entry.roundOption || 'none',
          };
        });
        setEditStates(initialEditStates);
      }
    } catch (err: any) {
      console.error('Failed to fetch pricing entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate price
  const calculatePrice = (internalCost: number, margin: number, roundOption: 'none' | 'up' | 'down') => {
    if (internalCost === undefined || margin === undefined) return 0;
    let calculated = internalCost * (1 + (margin / 100));
    switch (roundOption) {
      case 'up':
        calculated = Math.ceil(calculated);
        break;
      case 'down':
        calculated = Math.floor(calculated);
        break;
      case 'none':
      default:
        calculated = parseFloat(calculated.toFixed(2));
        break;
    }
    return calculated;
  };

  const handleUpdatePricingEntry = async (entryId: string) => { // Renamed from handleUpdatePricing
    setSavingEntryId(entryId); // Renamed
    setError(null);
    const entryEditState = editStates[entryId]; // Renamed
    if (!entryEditState) return;

    const newPrice = calculatePrice(
      entryEditState.internalCostInput || 0, // Renamed
      entryEditState.marginInput || 0,       // Renamed
      entryEditState.roundOption
    );

    try {
      const res = await fetch(`/api/admin/pricing-entries/${entryId}`, { // New API endpoint
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalCostInput: entryEditState.internalCostInput, // Renamed
          marginInput: entryEditState.marginInput,             // Renamed
          calculatedPrice: newPrice,
          roundOption: entryEditState.roundOption, // Send the round option too
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update pricing entry');
      }

      // Update local pricingEntries state to reflect new price
      setPricingEntries(prevEntries => // Renamed
        prevEntries.map(e => // Renamed
          e.id === entryId ? {
            ...e,
            internalCostInput: entryEditState.internalCostInput, // Renamed
            marginInput: entryEditState.marginInput,             // Renamed
            calculatedPrice: newPrice,
            roundOption: entryEditState.roundOption,
          } : e
        )
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingEntryId(null);
    }
  };

  const handleEditStateChange = (entryId: string, field: 'internalCostInput' | 'marginInput' | 'roundOption', value: any) => { // Renamed
    setEditStates(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      },
    }));
  };

  // Function to handle adding a new pricing entry
  const handleAddNewPricingEntry = async () => {
    setAddingNewEntry(true);
    setNewEntryError(null);
    try {
      const newCalculatedPrice = calculatePrice(
        newEntryFormInternalCost || 0,
        newEntryFormMargin || 0,
        newEntryFormRoundOption
      );

      const res = await fetch('/api/admin/pricing-entries', { // POST API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEntryFormName,
          internalCostInput: newEntryFormInternalCost,
          marginInput: newEntryFormMargin,
          calculatedPrice: newCalculatedPrice,
          pricingType: newEntryFormPricingType,
          roundOption: newEntryFormRoundOption,
          description: newEntryFormDescription,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add pricing entry');
      }

      // Reset form and refetch entries
      setNewEntryFormName('');
      setNewEntryFormInternalCost(0);
      setNewEntryFormMargin(0);
      setNewEntryFormRoundOption('none');
      setNewEntryFormPricingType('flat');
      setNewEntryFormDescription('');
      fetchPricingEntries();

    } catch (err: any) {
      setNewEntryError(err.message);
    } finally {
      setAddingNewEntry(false);
    }
  };

  if (loading) return <div className="p-6">Loading pricing data...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Pricing Entries Management</h1>
        <p className="text-gray-500 mt-1">Create and manage reusable pricing templates.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {services.length === 0 ? (
          <p className="text-gray-500">No services found. Add them on the Services page.</p>
        ) : (
          services.map((service) => (
            <div key={service.id}>
              {service.name}
            </div>
          ))}}
        </div>
      </div>
    </div>
  );
}
