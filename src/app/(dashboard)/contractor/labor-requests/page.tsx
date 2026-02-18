import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { laborRequests, requests, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import SubmitEstimateDialog from './submit-estimate-dialog';

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

  // Fetch pending labor requests assigned to this contractor
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
  .where(and(eq(laborRequests.contractorId, userPayload.id), eq(laborRequests.status, 'pending')))
  .orderBy(desc(laborRequests.createdAt));

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Sub Quotes (Labor Requests)</h1>
        <p className="text-gray-500 mt-1">Review quote requests from admins.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {laborReqs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No pending quote requests.</p>
        ) : (
          <div className="space-y-4">
            {laborReqs.map(req => (
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

                <SubmitEstimateDialog 
                  requestId={req.id} 
                  projectName={req.projectName || 'General Inquiry'} 
                  requestMessage={req.message}
                  requestDescription={req.projectDescription}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
