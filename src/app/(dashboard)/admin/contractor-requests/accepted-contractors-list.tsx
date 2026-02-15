import { User } from 'lucide-react';

interface Contractor {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  createdAt: Date;
}

interface AcceptedContractorsListProps {
  contractors: Contractor[];
}

export default function AcceptedContractorsList({ contractors }: AcceptedContractorsListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--brand-black)] mb-4">Accepted Contractors</h2>
      {contractors.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No active contractors.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractors.map(contractor => (
            <div key={contractor.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start gap-3">
               <div className="bg-gray-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
              <div>
                <p className="font-semibold text-[var(--brand-black)]">{contractor.name}</p>
                 {contractor.companyName && (
                  <p className="text-sm font-medium text-gray-700">{contractor.companyName}</p>
                )}
                <p className="text-sm text-gray-600">{contractor.email}</p>
                <p className="text-xs text-gray-500 mt-1">Joined: {new Date(contractor.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
