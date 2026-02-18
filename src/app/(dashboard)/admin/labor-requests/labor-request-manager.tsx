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

interface LaborRequest {
  id: string;
  contractorName: string | null;
  projectName: string | null;
  status: string;
  message: string;
  createdAt: Date;
}

interface LaborRequestManagerProps {
  contractors: Contractor[];
  clientRequests: ClientRequest[];
  existingLaborRequests: LaborRequest[];
}

export default function LaborRequestManager({ contractors, clientRequests, existingLaborRequests }: LaborRequestManagerProps) {
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



      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-150px)]">



        {/* Left Column: Sent Labor Requests History */}



        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">



          <div className="p-4 border-b border-gray-100 bg-gray-50">



            <h3 className="text-lg font-bold text-[var(--brand-black)]">Sent Labor Requests</h3>



          </div>



          <div className="flex-1 overflow-auto">



            {existingLaborRequests.length === 0 ? (



              <div className="p-8 text-center text-gray-500">



                No labor requests sent yet.



              </div>



            ) : (



              <table className="min-w-full divide-y divide-gray-200">



                <thead className="bg-gray-50 sticky top-0 z-10">



                  <tr>



                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor</th>



                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>



                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>



                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>



                  </tr>



                </thead>



                <tbody className="bg-white divide-y divide-gray-200">



                  {existingLaborRequests.map((request) => (



                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">



                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{request.contractorName || 'Unknown'}</td>



                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-[100px] truncate" title={request.projectName || ''}>{request.projectName || 'Unknown'}</td>



                      <td className="px-4 py-3 whitespace-nowrap">



                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize



                          ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 



                            request.status === 'approved' ? 'bg-green-100 text-green-800' : 



                            'bg-gray-100 text-gray-800'}`}>



                          {request.status}



                        </span>



                      </td>



                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">



                        {new Date(request.createdAt).toLocaleDateString()}



                      </td>



                    </tr>



                  ))}



                </tbody>



              </table>



            )}



          </div>



        </div>



  



        {/* Right Column: New Request Flow */}



        <div className="flex flex-col gap-6 h-full overflow-hidden">



          



          {/* Step 1: Select Contractor */}



          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden flex-1 min-h-0">



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



  



          {/* Step 2: Select Request */}



          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden flex-1 min-h-0">



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



  



          {/* Step 3: Action Box */}



          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0">



              <h3 className="font-semibold text-[var(--brand-black)] mb-3 flex items-center gap-2">



                  <Send className="h-4 w-4" /> Send Request



              </h3>



              



              {!selectedContractor || !selectedRequest ? (



                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">



                      <p className="text-sm">Select a contractor and a request above.</p>



                  </div>



              ) : (



                  <div className="space-y-3">



                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">



                          <span className="font-medium text-[var(--brand-black)] truncate max-w-[40%]">{selectedContractor.name}</span>



                          <ArrowRight className="h-3 w-3 shrink-0" />



                          <span className="font-medium text-[var(--brand-black)] truncate max-w-[40%]">{selectedRequest.projectName}</span>



                      </div>



                      



                      <div>



                          <textarea



                              id="message"



                              rows={2}



                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-[var(--brand-black)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-black)] resize-none"



                              placeholder="Message (optional)..."



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
