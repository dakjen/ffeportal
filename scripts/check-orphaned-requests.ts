import { db } from '@/db';
import { requests, projects } from '@/db/schema';
import { isNull, eq } from 'drizzle-orm';

async function checkRequestsWithoutProjects() {
  const orphanedRequests = await db.select({
    id: requests.id,
    projectName: requests.projectName,
    projectId: requests.projectId,
    createdAt: requests.createdAt
  })
  .from(requests)
  .where(isNull(requests.projectId));

  console.log(`Found ${orphanedRequests.length} requests without a project ID:`);
  orphanedRequests.forEach(req => {
    console.log(`- ID: ${req.id}, Name: ${req.projectName}, Created: ${req.createdAt}`);
  });
  
  process.exit(0);
}

checkRequestsWithoutProjects();
