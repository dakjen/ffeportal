import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import { db } from '@/db';
import { requests, users, projects } from '@/db/schema'; // Import projects
import { eq, desc, inArray, or } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ProjectRequestsDisplay from './project-requests-display'; // Import the new Client Component

export default async function CurrentProjectsPage() {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = await verifyToken(token);
    if (!user || user.role !== 'client') {
      redirect('/login');
    }
  } catch (error) {
    console.error('Client projects auth error:', error);
    redirect('/login');
  }

  const userId = user.id;

  const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
  const rootId = currentUser.parentId || currentUser.id;

  const teamMembers = await db.select({ id: users.id })
     .from(users)
     .where(or(eq(users.id, rootId), eq(users.parentId, rootId)));
  const teamIds = teamMembers.map(u => u.id);

  // Fetch all projects for the client
  const clientProjects = await db.select({
    id: projects.id,
    name: projects.name,
    location: projects.location,
    description: projects.description,
    createdAt: projects.createdAt,
  })
  .from(projects)
  .where(eq(projects.clientId, userId)) // Projects are owned by individual clients
  .orderBy(desc(projects.createdAt));

  // Fetch all requests for the client and their team
  const allClientRequests = await db.select({
    id: requests.id,
    projectId: requests.projectId,
    projectName: requests.projectName,
    description: requests.description,
    status: requests.status,
    createdAt: requests.createdAt,
  })
    .from(requests)
    .where(inArray(requests.clientId, teamIds))
    .orderBy(desc(requests.createdAt));

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)]">My Projects</h1>
          <p className="text-gray-500 mt-1">Manage your projects and associated requests.</p>
        </div>
        <div className="flex gap-3">
            <Link 
              href="/client/new-project" 
              className="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-[var(--brand-black)] shadow-sm hover:bg-gray-300 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Link>
            <Link 
              href="/client/new-request" 
              className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Link>
        </div>
      </div>

      <ProjectRequestsDisplay initialProjects={clientProjects} initialRequests={allClientRequests} />
    </div>
  );
}
