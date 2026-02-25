import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { laborRequests, requests, users } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function ContractorLaborRequestsPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let userPayload;
  try {
    userPayload = await verifyToken(token);
    if (userPayload.role !== 'contractor') {
      redirect('/login');
    }
  } catch (error) {
    redirect('/login');
  }

  // Fetch pending and quoted labor requests assigned to this contractor
  const laborReqs = await db.select({
    id: laborRequests.id,
    adminName: users.name,
    adminEmail: users.email,
    projectName: requests.projectName,
    projectDescription: requests.description,
    message: laborRequests.message,
    status: laborRequests.status,
    createdAt: laborRequests.createdAt,
  })
  .from(laborRequests)
  .leftJoin(users, eq(laborRequests.adminId, users.id))
  .leftJoin(requests, eq(laborRequests.requestId, requests.id))
  .where(and(
    eq(laborRequests.contractorId, userPayload.id),
    // Fetch both pending and quoted requests
    inArray(laborRequests.status, ['pending', 'quoted'])
  ))
  .orderBy(desc(laborRequests.createdAt));

  const pendingRequests = laborReqs.filter(req => req.status === 'pending');
  const quotedRequests = laborReqs.filter(req => req.status === 'quoted');

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Sub Quotes (Labor Requests)</h1>
        <p className="text-gray-500 mt-1">Review quote requests from admins and view sent estimates.</p>
      </div>

      <div className="space-y-8">
        {/* Pending Requests Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-[var(--brand-black)] mb-4">Pending Requests</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No pending quote requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[var(--brand-black)]">{req.projectName || 'General Inquiry'}</h3>
                    <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full capitalize">{req.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">From: {req.adminName} ({req.adminEmail})</p>
                  <div className="bg-white p-3 rounded border border-gray-100 mb-4">
                    <p className="text-sm text-gray-800 italic">&quot;{req.message}&quot;</p>
                  </div>
                  
                  {req.projectDescription && (
                     <p className="text-sm text-gray-500 mb-4 line-clamp-2">{req.projectDescription}</p>
                  )}

                  <Link 
                    href={`/contractor/labor-requests/${req.id}/quote`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--brand-black)] hover:bg-gray-800 transition-colors"
                  >
                    Submit Estimate <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sent/Quoted Requests Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-[var(--brand-black)] mb-4">Sent Estimates</h2>
          {quotedRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sent estimates yet.</p>
          ) : (
            <div className="space-y-4">
              {quotedRequests.map(req => (
                <div key={req.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[var(--brand-black)]">{req.projectName || 'General Inquiry'}</h3>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize mb-1">Sent</span>
                      <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">To: {req.adminName}</p>
                  
                  <Link 
                    href={`/contractor/labor-requests/${req.id}/quote`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors mt-2"
                  >
                    View Estimate Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
