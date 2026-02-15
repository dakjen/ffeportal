'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ClipboardList, Send, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Contractor {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
}

interface ClientRequest {
  id: string;
  projectName: string;
  description: string | null;
  clientName: string | null;
  createdAt: Date;
}

interface LaborRequestManagerProps {
  contractors: Contractor[];
  clientRequests: ClientRequest[];
}

export default function LaborRequestManager({ contractors, clientRequests }: LaborRequestManagerProps) {
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleSendRequest = async () => {
    if (!selectedContractor || !selectedRequest || !message.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/admin/labor-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: selectedContractor.id,
          requestId: selectedRequest.id,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send request');
      }

      toast.success('Labor request sent successfully');
      // Reset selection or just message? Maybe keep context
      setMessage('');
      setSelectedContractor(null);
      setSelectedRequest(null);
      router.refresh();
    } catch (error) {
      toast.error('Failed to send labor request');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
      {/* Left Column: Contractors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-[var(--brand-black)] flex items-center gap-2">
            <User className="h-4 w-4" /> Select Contractor
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {contractors.length === 0 ? (
             <p className="text-center text-gray-500 py-8">No active contractors found.</p>
          ) : (
            contractors.map((contractor) => (
              <button
                key={contractor.id}
                onClick={() => setSelectedContractor(contractor)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedContractor?.id === contractor.id
                    ? 'border-[var(--brand-black)] bg-[var(--brand-black)] text-white'
                    : 'border-gray-100 hover:bg-gray-50 text-[var(--brand-black)]'
                }`}
              >
                <div className="font-medium">{contractor.name}</div>
                {contractor.companyName && <div className={`text-sm ${selectedContractor?.id === contractor.id ? 'text-gray-300' : 'text-gray-500'}`}>{contractor.companyName}</div>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Requests & Action */}
      <div className="flex flex-col gap-6 h-full">
        {/* Request Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden flex-1">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-[var(--brand-black)] flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Select Client Request
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {clientRequests.length === 0 ? (
                 <p className="text-center text-gray-500 py-8">No active client requests found.</p>
             ) : (
                clientRequests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedRequest?.id === req.id
                        ? 'border-[var(--brand-black)] bg-[var(--brand-black)] text-white'
                        : 'border-gray-100 hover:bg-gray-50 text-[var(--brand-black)]'
                    }`}
                  >
                    <div className="font-medium">{req.projectName}</div>
                    <div className={`text-sm ${selectedRequest?.id === req.id ? 'text-gray-300' : 'text-gray-500'}`}>
                      {req.clientName || 'Unknown Client'} • {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
             )}
          </div>
        </div>

        {/* Action Box */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-[var(--brand-black)] mb-3 flex items-center gap-2">
                <Send className="h-4 w-4" /> Send Request
            </h3>
            
            {!selectedContractor || !selectedRequest ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p>Select a contractor and a request to proceed.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="font-medium text-[var(--brand-black)]">{selectedContractor.name}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium text-[var(--brand-black)]">{selectedRequest.projectName}</span>
                    </div>
                    
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message to Contractor</label>
                        <textarea
                            id="message"
                            rows={3}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-black)]"
                            placeholder="Please provide a quote for this project..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSendRequest}
                        disabled={isSending || !message.trim()}
                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--brand-black)] hover:bg-gray-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Sending...
                            </>
                        ) : (
                            'Send Request'
                        )}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
