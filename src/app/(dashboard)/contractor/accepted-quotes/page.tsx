import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { laborRequests, requests, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CheckCircle, Clock, Check, BarChart3, TrendingUp, Flag } from 'lucide-react';

export default async function AcceptedQuotesPage() {
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

  // Fetch accepted labor requests (status: 'approved')
  // Also fetch the progress status
  const acceptedReqs = await db.select({
    id: laborRequests.id,
    adminName: users.name,
    projectName: requests.projectName,
    projectDescription: requests.description,
    progress: laborRequests.progress,
    status: laborRequests.status,
    createdAt: laborRequests.createdAt,
    updatedAt: laborRequests.updatedAt,
  })
  .from(laborRequests)
  .leftJoin(users, eq(laborRequests.adminId, users.id))
  .leftJoin(requests, eq(laborRequests.requestId, requests.id))
  .where(and(eq(laborRequests.contractorId, userPayload.id), eq(laborRequests.status, 'approved'))) // Assuming 'approved' means accepted quote
  .orderBy(desc(laborRequests.updatedAt));

  const progressSteps = [
    { label: 'Quote Sent', value: 'quote_sent' },
    { label: 'Quote Accepted', value: 'quote_accepted' },
    { label: 'Timeline Developed', value: 'timeline_developed' },
    { label: 'Project Started', value: 'project_started' },
    { label: 'Project Completed', value: 'project_completed' },
  ];

  const getProgressIndex = (currentProgress: string | null) => {
    if (!currentProgress) return 0; // Default to first step if null/unknown
    return progressSteps.findIndex(step => step.value === currentProgress);
  };

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--brand-black)]">Accepted Quotes</h1>
        <p className="text-gray-500 mt-1">Track the progress of your active projects.</p>
      </div>

      <div className="space-y-6">
        {acceptedReqs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <p>No accepted quotes or active projects found.</p>
          </div>
        ) : (
          acceptedReqs.map(req => {
            const currentStepIndex = getProgressIndex(req.progress);
            const progressPercentage = Math.max(5, ((currentStepIndex + 1) / progressSteps.length) * 100);

            return (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--brand-black)]">{req.projectName || 'Project'}</h3>
                    <p className="text-sm text-gray-500">Managed by: {req.adminName}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded capitalize">
                    {req.progress ? req.progress.replace(/_/g, ' ') : 'In Progress'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-8 px-2">
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div 
                      style={{ width: `${progressPercentage}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[var(--brand-black)] transition-all duration-500"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 relative">
                    {progressSteps.map((step, index) => {
                      const isActive = index <= currentStepIndex;
                      return (
                        <div key={step.value} className={`flex flex-col items-center ${isActive ? 'text-[var(--brand-black)] font-semibold' : ''} w-20 text-center`}>
                           <div className={`w-3 h-3 rounded-full mb-1 transition-colors ${isActive ? 'bg-[var(--brand-black)]' : 'bg-gray-300'}`}></div>
                           <span>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 border-t border-gray-50 pt-4">
                     <button className="text-sm text-[var(--brand-red)] hover:text-[#5a0404] font-medium transition-colors">
                        View Details
                     </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
