'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  isResolved: boolean;
}

interface AdminContactSubmissionsProps {
  initialSubmissions: ContactSubmission[];
}

export default function AdminContactSubmissions({ initialSubmissions }: AdminContactSubmissionsProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const router = useRouter();

  const handleMarkAsResolved = async (submissionId: string) => {
    if (!confirm('Are you sure you want to mark this submission as resolved?')) {
      return;
    }
    setResolvingId(submissionId);
    try {
      const response = await fetch(`/api/admin/contact-submissions/${submissionId}/resolve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as resolved');
      }

      toast.success('Submission marked as resolved.');
      // Optimistically update UI or re-fetch data
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
      router.refresh(); // Re-fetch server component data
    } catch (error: any) {
      toast.error(error.message || 'Error marking submission as resolved.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-[var(--brand-black)]">Contact Submissions</h2>
        <p className="text-sm text-gray-500">Review and manage support requests.</p>
      </div>
      <div className="p-6">
        {submissions.length === 0 ? (
          <p className="text-gray-500">No new contact submissions.</p>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <p className="text-sm font-semibold text-[var(--brand-black)]">From: {submission.name} ({submission.email})</p>
                <p className="text-sm text-gray-700 mt-1">Subject: {submission.subject}</p>
                <p className="text-sm text-gray-600 mt-1">{submission.message}</p>
                <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
                <button
                  onClick={() => handleMarkAsResolved(submission.id)}
                  disabled={resolvingId === submission.id}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {resolvingId === submission.id ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-3 w-3" />
                  )}
                  Mark as Resolved
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
