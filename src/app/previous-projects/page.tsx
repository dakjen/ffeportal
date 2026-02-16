import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PreviousProjectsPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-white)] text-gray-900 font-sans p-6">
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-gray-600 hover:text-[var(--brand-red)] transition-colors">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Link>
      </div>
      <div className="max-w-4xl mx-auto py-16">
        <h1 className="text-4xl font-bold text-[var(--brand-black)] mb-8 text-center">Our Previous Projects</h1>
        
        <p className="text-lg text-gray-700 mb-6 text-center">
          Here you'll find a selection of our past projects showcasing our expertise in furniture, fixtures, and equipment (FF&E) procurement and design solutions.
        </p>

        <div className="space-y-12 mt-12">
          {/* Placeholder Project Item 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[var(--brand-black)] mb-3">Multifamily Development: The Grand Lofts</h2>
            <p className="text-gray-600 mb-4">
              Provided end-to-end FF&E solutions for a 150-unit luxury apartment complex, including common areas, model units, and tenant amenities. Managed sourcing, logistics, and installation for all furniture, lighting, and decor.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <span>#Multifamily</span> <span>#FF&EProcurement</span> <span>#LuxuryInteriors</span>
            </div>
          </div>

          {/* Placeholder Project Item 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[var(--brand-black)] mb-3">Boutique Office: Innovate Hub HQ</h2>
            <p className="text-gray-600 mb-4">
              Designed and furnished a modern co-working space for a tech startup, focusing on ergonomic solutions, collaborative zones, and brand-aligned aesthetics. Sourced custom workstations and flexible seating arrangements.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <span>#OfficeDesign</span> <span>#CommercialFF&E</span> <span>#TechWorkspace</span>
            </div>
          </div>

          {/* Placeholder Project Item 3 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[var(--brand-black)] mb-3">Residential Staging: Coastal Retreat</h2>
            <p className="text-gray-600 mb-4">
              Curated and installed a complete furniture package for a high-end residential property aimed at accelerating sales. Focused on creating an aspirational lifestyle image through strategic design and staging.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              <span>#HomeStaging</span> <span>#ResidentialDesign</span> <span>#RealEstate</span>
            </div>
          </div>

          <p className="text-center text-gray-500 mt-16">More projects coming soon!</p>
        </div>
      </div>
    </div>
  );
}