'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');

    // In a real application, you would send this data to an API endpoint
    // For now, we'll just simulate a successful submission
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(data.message || 'Message sent successfully!');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setStatus(data.message || 'Failed to send message.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setStatus('An unexpected error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--brand-black)] text-gray-900 font-sans p-6 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Link>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--brand-black)]">Contact Support</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]"
            ></textarea>
          </div>
          {status && (
            <p className={`text-sm text-center ${status.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {status}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)]"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}