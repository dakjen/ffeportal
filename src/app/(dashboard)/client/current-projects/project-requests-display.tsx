'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Folder, FileText, ArrowLeft } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  createdAt: Date;
}

interface Request {
  id: string;
  projectId: string | null;
  projectName: string;
  description: string | null;
  status: string;
  createdAt: Date;
}

interface ProjectRequestsDisplayProps {
  initialProjects: Project[];
  initialRequests: Request[];
}

export default function ProjectRequestsDisplay({ initialProjects, initialRequests }: ProjectRequestsDisplayProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = useMemo(() => {
    return initialProjects.find(p => p.id === selectedProjectId);
  }, [initialProjects, selectedProjectId]);

  const filteredRequests = useMemo(() => {
    if (!selectedProjectId) return [];
    return initialRequests.filter(req => req.projectId === selectedProjectId);
  }, [initialRequests, selectedProjectId]);

  const activeRequests = useMemo(() => {
    return filteredRequests.filter(req =>
      ['pending', 'quoted', 'approved', 'contract_sent'].includes(req.status)
    );
  }, [filteredRequests]);

  return (
    <div className="space-y-6">
      {!selectedProjectId ? (
        // Project List View
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-[var(--brand-black)] flex items-center gap-2">
                <Folder className="h-5 w-5" /> Your Projects
            </h3>
            <Link 
              href="/client/new-project" 
              className="inline-flex items-center justify-center rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-[var(--brand-black)] shadow-sm hover:bg-gray-300 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Link>
          </div>

          {initialProjects.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
              <p>You haven&apos;t created any projects yet. Let&apos;s start one!</p>
              <div className="mt-6">
                <Link 
                  href="/client/new-project" 
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:ring-offset-2"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create New Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {initialProjects.map(project => (
                <div 
                  key={project.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <div>
                    <h4 className="font-medium text-[var(--brand-black)]">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.location}</p>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Requests List for Selected Project View
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setSelectedProjectId(null)} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Back to projects"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
                <div>
                    <h3 className="text-2xl font-bold text-[var(--brand-black)]">{selectedProject?.name}</h3>
                    <p className="text-gray-500 text-sm">{selectedProject?.location} | {selectedProject?.description}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-semibold text-[var(--brand-black)] flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Requests for this Project
                    </h4>
                    <Link 
                      href={`/client/new-request?projectId=${selectedProjectId}`} 
                      className="inline-flex items-center justify-center rounded-md bg-[var(--brand-red)] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] transition-colors"
                    >
                      <Plus className="mr-2 h-4 w-4" /> New Request
                    </Link>
                </div>

                {activeRequests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <h5 className="text-lg font-medium text-gray-900 mb-2">No active requests for this project.</h5>
                        <p>Start a new request for {selectedProject?.name}!</p>
                        <div className="mt-6">
                            <Link 
                              href={`/client/new-request?projectId=${selectedProjectId}`} 
                              className="inline-flex items-center justify-center rounded-md border border-transparent bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] focus:ring-offset-2"
                            >
                              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                              New Request
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activeRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.projectName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{req.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                  req.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                  req.status === 'quoted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/client/requests/${req.id}`} className="text-[var(--brand-red)] hover:text-[#5a0404]">
                                                {req.status === 'quoted' || req.status === 'approved' || req.status === 'contract_sent' ? 'View Quote' : 'View Details'}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
