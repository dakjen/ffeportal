'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      router.push('/login'); // Redirect to login after successful registration

    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-white">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-600 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
          />
        </div>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-300">
            Company Name (Optional)
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 block w-full border border-gray-600 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-600 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-600 bg-gray-800 text-white rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)]"
        >
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--brand-beige)] hover:text-white">
          Sign In
        </Link>
      </p>
    </div>
  );
}
