'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinkIcon, PlusCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const newRequestSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string().min(1, 'Project Name is required'),
  projectLocation: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  documentUrls: z.array(z.string().url('Invalid URL format')).optional(),
}).superRefine((data, ctx) => {
  if (!data.projectId) {
    if (!data.projectLocation || data.projectLocation.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Project Location is required for new projects',
        path: ['projectLocation'],
      });
    }
  }
});

type NewRequestFormValues = z.infer<typeof newRequestSchema>;

interface ProjectOption {
  id: string;
  name: string;
  location: string;
}

export default function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [fetchingProjects, setFetchingProjects] = useState(true);
  const [documentUrls, setDocumentUrls] = useState<string[]>([]); // Changed from selectedFiles
  const [newUrlInput, setNewUrlInput] = useState(''); // State for the new URL input field

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NewRequestFormValues>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      documentUrls: [], // Initialize documentUrls
    },
  });

  const selectedProjectId = watch('projectId');

  // Fetch projects when component mounts
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/client/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          
          const queryProjectId = searchParams.get('projectId');
          if (queryProjectId && data.some((p: ProjectOption) => p.id === queryProjectId)) {
            setValue('projectId', queryProjectId);
            const selectedProject = data.find((p: ProjectOption) => p.id === queryProjectId);
            if (selectedProject) {
              setValue('projectName', selectedProject.name);
            }
          } else if (data.length > 0) {
            setValue('projectId', data[0].id);
            setValue('projectName', data[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        toast.error('Failed to load your projects.');
      } finally {
        setFetchingProjects(false);
      }
    }
    fetchProjects();
  }, [setValue, searchParams]);

  // Update projectName in form whenever projectId changes
  useEffect(() => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      setValue('projectName', project.name);
    } else {
      setValue('projectName', '');
    }
  }, [selectedProjectId, projects, setValue]);

  // Handle adding a new URL
  const handleAddUrl = useCallback(() => {
    if (newUrlInput && z.string().url().safeParse(newUrlInput).success) {
      setDocumentUrls((prev) => [...prev, newUrlInput]);
      setNewUrlInput('');
      setValue('documentUrls', [...documentUrls, newUrlInput]); // Update form state
    } else if (newUrlInput) {
      toast.error('Please enter a valid URL.');
    }
  }, [newUrlInput, documentUrls, setValue]);

  // Handle removing a URL
  const handleRemoveUrl = useCallback((urlToRemove: string) => {
    setDocumentUrls((prev) => prev.filter((url) => url !== urlToRemove));
    setValue('documentUrls', documentUrls.filter((url) => url !== urlToRemove)); // Update form state
  }, [documentUrls, setValue]);

  const onSubmit = async (data: NewRequestFormValues) => {
    setLoading(true);
    setError('');
    let newRequestId = ''; // To store the ID of the newly created request

    try {
      let finalProjectId = data.projectId;

      // If no project selected, create a new one implicitly
      if (!finalProjectId) {
        const createProjectResponse = await fetch('/api/client/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.projectName,
            location: data.projectLocation,
            description: data.description,
          }),
        });

        const newProjectResult = await createProjectResponse.json();

        if (!createProjectResponse.ok) {
          throw new Error(newProjectResult.message || 'Failed to create new project.');
        }
        finalProjectId = newProjectResult.project.id;
        toast.success(`New project "${data.projectName}" created.`);
      }

      // Submit the request with the resolved project ID
      const response = await fetch('/api/client/requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            projectId: finalProjectId,
            projectName: data.projectName,
            description: data.description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit request.');
      }
      newRequestId = result.request.id;

      // --- Document URL Submission Logic ---
      if (documentUrls.length > 0) {
        const docUploadRes = await fetch('/api/client/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: newRequestId,
            documentUrls: documentUrls,
          }),
        });

        if (!docUploadRes.ok) {
          const docErrorData = await docUploadRes.json();
          console.error('Failed to submit document URLs:', docErrorData.message);
          toast.error('Request submitted, but some document URLs failed to link.');
        } else {
          toast.success('Document URLs linked successfully!');
        }
      }

      toast.success('Request submitted successfully!');
      router.push('/client/current-projects'); 
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || 'An unexpected error occurred while submitting the request.');
      else setError('An unexpected error occurred while submitting the request.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--brand-black)]">Submit New Request</h2>
        <p className="text-gray-500 mt-2">Provide details about your FF&E needs and we&apos;ll get back to you with a quote.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Selection */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-semibold text-[var(--brand-black)] mb-2">
                Choose Existing Project (Optional)
              </label>
              {fetchingProjects ? (
                <p className="text-gray-500 text-sm">Loading projects...</p>
              ) : (
                <select
                  id="projectId"
                  {...register('projectId')}
                  className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] transition-colors"
                >
                  <option value="">-- Choose a Project --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.location})
                    </option>
                  ))}
                </select>
              )}
              {errors.projectId && (
                <p className="text-red-500 text-sm mt-1">{errors.projectId.message}</p>
              )}
            </div>

            {/* Project Name (editable if no projectId selected) */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-semibold text-[var(--brand-black)] mb-2">
                Project Name {selectedProjectId ? '(From Selection)' : '(Required for New Project)'}
              </label>
              <input
                type="text"
                id="projectName"
                {...register('projectName')}
                readOnly={!!selectedProjectId}
                className={`w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-900 ${selectedProjectId ? 'bg-gray-100' : 'focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)]'} transition-colors`}
                placeholder={selectedProjectId ? '' : 'Enter a name for your new project'}
              />
              {errors.projectName && (
                <p className="text-red-500 text-sm mt-1">{errors.projectName.message}</p>
              )}
            </div>

            {/* Project Location (editable if no projectId selected) */}
            {!selectedProjectId && (
                <div>
                  <label htmlFor="projectLocation" className="block text-sm font-semibold text-[var(--brand-black)] mb-2">
                    Project Location (Required for New Project)
                  </label>
                  <input
                    type="text"
                    id="projectLocation"
                    {...register('projectLocation')}
                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] transition-colors"
                    placeholder="e.g., San Francisco, CA"
                  />
                  {errors.projectLocation && (
                    <p className="text-red-500 text-sm mt-1">{errors.projectLocation.message}</p>
                  )}
                </div>
            )}
            
            
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-[var(--brand-black)] mb-2">
                Description & Requirements
              </label>
              <textarea
                id="description"
                rows={6}
                placeholder="Describe the items you need, quantities, style preferences, timeline..."
                {...register('description')}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] transition-colors resize-y"
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Document URL Input Component */}
            <div>
              <label className="block text-sm font-semibold text-[var(--brand-black)] mb-2">
                Attach Document Links (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-lg shadow-sm p-3 text-gray-900 focus:ring-[var(--brand-red)] focus:border-[var(--brand-red)] transition-colors"
                  placeholder="Paste a link to your document (e.g., Google Drive, Dropbox)"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="flex-shrink-0 px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[var(--brand-red)] hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)]"
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>

              {documentUrls.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Linked Documents:</p>
                  {documentUrls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">{url}</a>
                      </div>
                      <button type="button" onClick={() => handleRemoveUrl(url)} className="text-gray-500 hover:text-gray-700">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.documentUrls && (
                <p className="text-red-500 text-sm mt-1">{errors.documentUrls.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-4 px-6 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingProjects} // Removed uploadingFiles
                className="px-8 py-3 border border-transparent rounded-full shadow-lg text-sm font-semibold text-white bg-[var(--brand-red)] hover:bg-[#5a0404] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-red)] disabled:opacity-70 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {'Submitting Request...'}
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}