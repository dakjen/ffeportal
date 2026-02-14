'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });
    
            if (!response.ok) {
              const data = await response.json();
              setError(data.message || 'Login failed');
              return;
            }
    
            const data = await response.json(); // Parse JSON for successful responses too
            router.push(data.redirectUrl); // Client-side navigation
    
          } catch (err) {
            setError('An unexpected error occurred.');
            console.error(err);
          }  };

  return (
    <div className="p-6 relative"> {/* Add relative positioning */}
      <Link href="/" className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-2xl font-bold text-center mb-6 text-white">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-[var(--brand-beige)] hover:text-white">
          Sign Up
        </Link>
      </p>
    </div>
  );
}