'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Edit2, DollarSign, Briefcase } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  pricingType: z.enum(['hourly', 'flat']),
  internalCost: z.coerce.number().optional(),
  margin: z.coerce.number().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [pricingEntries, setPricingEntries] = useState<any[]>([]); // New state
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      pricingType: 'flat',
    },
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const [servicesRes, pricingEntriesRes] = await Promise.all([ // Fetch pricing entries too
        fetch('/api/admin/services'),
        fetch('/api/admin/pricing-entries'),
      ]);

      if (!servicesRes.ok) throw new Error('Failed to fetch services');
      if (!pricingEntriesRes.ok) throw new Error('Failed to fetch pricing entries'); // Error check for new fetch

      const servicesData = await servicesRes.json();
      const pricingEntriesData = await pricingEntriesRes.json();

      setServices(servicesData.services);
      setPricingEntries(pricingEntriesData.pricingEntries); // Set new state
    } catch (err: any) {
      console.error('Failed to fetch data:', err); // Generalize error
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onAddService = async (data: ServiceFormValues) => {
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to add service');
      }

      reset();
      fetchServices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const onDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Services & Pricing</h1>
        <p className="text-gray-500 mt-1">Manage your service catalog and internal costs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <p>Loading services...</p>
          ) : services.length === 0 ? (
            <p className="text-gray-500">No services found.</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[var(--brand-black)]">{service.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${service.pricingType === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {service.pricingType}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                  
                  <div className="mt-4 flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-400 block text-xs uppercase tracking-wide">Public Price</span>
                      <span className="font-semibold text-[var(--brand-black)]">${parseFloat(service.price).toFixed(2)}</span>
                    </div>
                    {service.internalCost && (
                      <div>
                        <span className="text-gray-400 block text-xs uppercase tracking-wide">Internal Cost</span>
                        <span className="font-medium text-gray-600">${parseFloat(service.internalCost).toFixed(2)}</span>
                      </div>
                    )}
                    {service.margin && (
                      <div>
                        <span className="text-gray-400 block text-xs uppercase tracking-wide">Margin</span>
                        <span className="font-medium text-green-600">{service.margin}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteService(service.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Service Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <div className="flex items-center gap-2 mb-6 text-[var(--brand-black)]">
            <Plus className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Add New Service</h2>
          </div>

          <form onSubmit={handleSubmit(onAddService)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Service Name</label>
              <input
                {...register('name')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          {...register('price')}
                                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                                        />
                                        {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>}
                                      </div>              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  {...register('pricingType')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                >
                  <option value="flat">Flat Rate</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Internal Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('internalCost')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                  />
                </div>
                  <label className="block text-sm font-medium text-gray-700">Margin (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('margin')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={adding}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--brand-black)] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)] disabled:opacity-70"
            >
              {adding ? 'Adding...' : 'Add Service'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}