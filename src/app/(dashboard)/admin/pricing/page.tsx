'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Save, Trash2 } from 'lucide-react';

// Define a schema for creating new pricing entries
const createPricingEntrySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  internalCostInput: z.coerce.number().min(0).optional(),
  marginInput: z.coerce.number().min(0).optional(),
  pricingType: z.enum(['hourly', 'flat']).default('flat'),
  roundOption: z.enum(['none', 'up', 'down']).default('none'),
  description: z.string().optional(),
  projectNotes: z.string().optional(),
  clientNotes: z.string().optional(),
  link: z.string().optional(),
});

// Define a schema for updating pricing entries (all fields optional)
const updatePricingEntrySchema = createPricingEntrySchema.partial().extend({
  id: z.string().min(1, 'Entry ID is required'),
  calculatedPrice: z.coerce.number().min(0).optional(), // Can be updated
});

type PricingEntryFormValues = z.infer<typeof createPricingEntrySchema>;
type UpdatePricingEntryFormValues = z.infer<typeof updatePricingEntrySchema>;

export default function AdminPricingPage() {
  const [pricingEntries, setPricingEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // States for the calculation (per-entry or for a selected one)
  const [editStates, setEditStates] = useState<{
    [entryId: string]: {
      internalCostInput?: number;
      marginInput?: number;
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
  const [newEntryFormProjectNotes, setNewEntryFormProjectNotes] = useState<string | undefined>('');
  const [newEntryFormClientNotes, setNewEntryFormClientNotes] = useState<string | undefined>('');
  const [newEntryFormLink, setNewEntryFormLink] = useState<string | undefined>('');
  const [addingNewEntry, setAddingNewEntry] = useState(false);
  const [newEntryError, setNewEntryError] = useState<string | null>(null);


  useEffect(() => {
    fetchPricingEntries();
  }, []);

  const fetchPricingEntries = async () => {
    try {
      const res = await fetch('/api/admin/pricing-entries');
      if (res.ok) {
        const data = await res.json();
        setPricingEntries(data.pricingEntries);
        // Initialize edit states
        const initialEditStates: typeof editStates = {};
        data.pricingEntries.forEach((entry: any) => {
          initialEditStates[entry.id] = {
            internalCostInput: parseFloat(entry.internalCostInput) || 0,
            marginInput: parseFloat(entry.marginInput) || 0,
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
        calculated = Math.ceil(calculated / 5) * 5;
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

  const handleUpdatePricingEntry = async (entryId: string) => {
    setSavingEntryId(entryId);
    setError(null);
    const entryEditState = editStates[entryId];
    if (!entryEditState) return;

    const newPrice = calculatePrice(
      entryEditState.internalCostInput || 0,
      entryEditState.marginInput || 0,
      entryEditState.roundOption
    );

    try {
      const res = await fetch(`/api/admin/pricing-entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalCostInput: entryEditState.internalCostInput,
          marginInput: entryEditState.marginInput,
          calculatedPrice: newPrice,
          roundOption: entryEditState.roundOption,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update pricing entry');
      }

      // Update local pricingEntries state to reflect new price
      setPricingEntries(prevEntries =>
        prevEntries.map(e =>
          e.id === entryId ? {
            ...e,
            internalCostInput: entryEditState.internalCostInput,
            marginInput: entryEditState.marginInput,
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

  const handleEditStateChange = (entryId: string, field: 'internalCostInput' | 'marginInput' | 'roundOption', value: any) => {
    setEditStates(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      },
    }));
  };

  const handleAddNewPricingEntry = async () => {
    setAddingNewEntry(true);
    setNewEntryError(null);
    try {
      const newCalculatedPrice = calculatePrice(
        newEntryFormInternalCost || 0,
        newEntryFormMargin || 0,
        newEntryFormRoundOption
      );

      const res = await fetch('/api/admin/pricing-entries', {
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
          projectNotes: newEntryFormProjectNotes,
          clientNotes: newEntryFormClientNotes,
          link: newEntryFormLink,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add pricing entry');
      }

      setNewEntryFormName('');
      setNewEntryFormInternalCost(0);
      setNewEntryFormMargin(0);
      setNewEntryFormRoundOption('none');
      setNewEntryFormPricingType('flat');
      setNewEntryFormDescription('');
      setNewEntryFormProjectNotes('');
      setNewEntryFormClientNotes('');
      setNewEntryFormLink('');
      fetchPricingEntries();

    } catch (err: any) {
      setNewEntryError(err.message);
    } finally {
      setAddingNewEntry(false);
    }
  };

  const handleDeletePricingEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing entry?')) return;
    try {
      const res = await fetch(`/api/admin/pricing-entries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete entry');
      fetchPricingEntries();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
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

      {/* Add New Entry Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[var(--brand-black)] mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5" /> Add New Pricing Entry
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={newEntryFormName}
              onChange={(e) => setNewEntryFormName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
              placeholder="e.g. Standard Consultation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Type</label>
            <select
              value={newEntryFormPricingType}
              onChange={(e) => setNewEntryFormPricingType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            >
              <option value="flat">Flat Rate</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
        </div>
  
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={newEntryFormDescription}
            onChange={(e) => setNewEntryFormDescription(e.target.value)}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            placeholder="Optional description..."
          />
        </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Notes</label>
              <input
                type="text"
                value={newEntryFormProjectNotes}
                onChange={(e) => setNewEntryFormProjectNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                placeholder="Internal notes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Notes</label>
              <input
                type="text"
                value={newEntryFormClientNotes}
                onChange={(e) => setNewEntryFormClientNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:focus:border-[var(--brand-red)]"
                placeholder="Client Name..."
              />
            </div>
          </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Link (URL)</label>
          <input
            type="text"
            value={newEntryFormLink}
            onChange={(e) => setNewEntryFormLink(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            placeholder="https://..."
          />
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-gray-50 p-4 rounded-lg mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Cost ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newEntryFormInternalCost}
              onChange={(e) => setNewEntryFormInternalCost(parseFloat(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margin (%)</label>
            <p className="text-xs text-gray-500 mt-1">25% margin is standard</p>
            <input
              type="number"
              min="0"
              step="0.1"
              value={newEntryFormMargin}
              onChange={(e) => setNewEntryFormMargin(parseFloat(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rounding</label>
            <select
              value={newEntryFormRoundOption}
              onChange={(e) => setNewEntryFormRoundOption(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-[var(--brand-black)] bg-white focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
            >
              <option value="none">None</option>
              <option value="up">Round Up</option>
              <option value="down">Round Down</option>
            </select>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Preview Price</p>
             <p className="text-xl font-bold text-[var(--brand-black)]">
               ${calculatePrice(newEntryFormInternalCost || 0, newEntryFormMargin || 0, newEntryFormRoundOption).toFixed(2)}
             </p>
          </div>
        </div>
  
        {newEntryError && <p className="text-red-600 text-sm mb-4">{newEntryError}</p>}
  
        <button
          onClick={handleAddNewPricingEntry}
          disabled={addingNewEntry || !newEntryFormName}
          className="w-full md:w-auto px-6 py-3 bg-[var(--brand-red)] text-white rounded-md font-medium hover:bg-[#5a0404] disabled:opacity-50 transition-colors shadow-sm"
        >
          {addingNewEntry ? 'Adding...' : 'Add Pricing Entry'}
        </button>
      </div>

      {/* Pricing Entries List */}
      <div className="grid grid-cols-1 gap-6">
        {pricingEntries.length === 0 ? (
          <p className="text-gray-500">No pricing entries found. Create one using the form below.</p>
        ) : (
          pricingEntries.map((entry) => (
            <div key={entry.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--brand-black)]">{entry.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${entry.pricingType === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {entry.pricingType === 'hourly' ? 'Hourly' : 'Flat'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{entry.description}</p>
                {entry.projectNotes && <p className="text-xs text-gray-400 mt-1"><strong>Project Notes:</strong> {entry.projectNotes}</p>}
                {entry.clientNotes && <p className="text-xs text-gray-400 mt-1"><strong>Client Notes:</strong> {entry.clientNotes}</p>}
                {entry.link && (
                  <a href={entry.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                    View Link
                  </a>
                )}
                
                <div className="mt-3 flex gap-6 text-sm text-gray-600">
                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400 block">Cost</span>
                    ${parseFloat(entry.internalCostInput || '0').toFixed(2)}
                  </div>
                                                          <div>
                                                            <span className="text-xs uppercase font-semibold text-gray-400 block">Margin</span>
                                                            {entry.marginInput || '0'}%
                                                          </div>                  <div>
                    <span className="text-xs uppercase font-semibold text-gray-400 block">Rounding</span>
                    <span className="capitalize">{entry.roundOption}</span>
                  </div>
                </div>
              </div>
  
              <div className="flex flex-col items-end gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Price</p>
                  <p className="text-2xl font-bold text-[var(--brand-black)]">${parseFloat(entry.calculatedPrice || '0').toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => handleDeletePricingEntry(entry.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-2"
                  title="Delete Entry"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}