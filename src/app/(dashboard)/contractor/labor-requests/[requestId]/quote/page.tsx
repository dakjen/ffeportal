import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { laborRequests, requests, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import EstimateForm from './estimate-form';

export default async function ContractorEstimatePage({ params }: { params: Promise<{ requestId: string }> }) {
  const resolvedParams = await params;
  const requestId = resolvedParams.requestId;
  
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

  // Fetch labor request details
  const [laborReq] = await db.select({
    id: laborRequests.id,
    adminName: users.name,
    adminEmail: users.email,
    projectName: requests.projectName,
    projectDescription: requests.description,
    message: laborRequests.message,
    status: laborRequests.status,
  })
  .from(laborRequests)
  .leftJoin(users, eq(laborRequests.adminId, users.id))
  .leftJoin(requests, eq(laborRequests.requestId, requests.id))
  .where(and(eq(laborRequests.id, requestId), eq(laborRequests.contractorId, userPayload.id)));

  if (!laborReq) {
    redirect('/contractor/labor-requests');
  }

  if (laborReq.status !== 'pending') {
    // Already quoted or approved/rejected
    redirect('/contractor/labor-requests');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Compile Estimate</h1>
        <p className="text-gray-500 mt-1">Provide a detailed quote for the requested services.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Request Details</h4>
        <div className="space-y-3 text-blue-800">
          <p><span className="font-medium">Project:</span> {laborReq.projectName || 'General Inquiry'}</p>
          <p><span className="font-medium">From:</span> {laborReq.adminName} ({laborReq.adminEmail})</p>
          <div className="bg-white p-4 rounded border border-blue-200 mt-2">
            <p className="italic">&quot;{laborReq.message}&quot;</p>
          </div>
          {laborReq.projectDescription && (
            <p className="mt-2"><span className="font-medium">Description:</span> {laborReq.projectDescription}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <EstimateForm requestId={requestId} />
      </div>
    </div>
  );
}
