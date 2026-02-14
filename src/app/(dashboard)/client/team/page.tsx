'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, UserPlus } from 'lucide-react';

const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export default function TeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/client/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      }
    } catch (err) {
      console.error('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  };

  const onAddUser = async (data: AddUserFormValues) => {
    setAddingUser(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/client/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to add user');
      }

      setSuccess('Team member added successfully!');
      reset();
      fetchTeam(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Team Management</h1>
        <p className="text-gray-500 mt-1">Manage users who can access your projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[var(--brand-black)]">Current Team Members</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-gray-500">Loading team...</div>
          ) : team.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No additional team members found.</p>
              <p className="text-sm mt-1">Use the form to add a colleague.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {team.map((member) => (
                <li key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[var(--brand-black)]">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add User Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <div className="flex items-center gap-2 mb-6 text-[var(--brand-black)]">
            <UserPlus className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Add New User</h2>
          </div>

          <form onSubmit={handleSubmit(onAddUser)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Initial Password</label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {success && <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">{success}</div>}
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

            <button
              type="submit"
              disabled={addingUser}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)] disabled:opacity-70 transition-colors"
            >
              {addingUser ? 'Adding...' : 'Add Team Member'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
