import Link from 'next/link';
import { ArrowRight, CheckCircle, PenTool, LayoutTemplate, Truck, Users } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-white)] text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--brand-black)] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">
            Design<span className="text-[var(--brand-beige)]">Domain</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <Link href="#services" className="hover:text-[var(--brand-beige)] transition-colors">Services</Link>
            <Link href="/previous-projects" className="hover:text-[var(--brand-beige)] transition-colors">Previous Projects</Link>
            <Link href="/about" className="hover:text-[var(--brand-beige)] transition-colors">About Us</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-[var(--brand-beige)] transition-colors py-2">
              Sign In
            </Link>
            <Link
              href="/register?role=client"
              className="rounded-full bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"
            >
              Start Project
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-[var(--brand-black)] text-white pt-32 pb-24 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Elevating Spaces through <br />
            <span className="text-[var(--brand-beige)]">Expert FF&E Procurement</span>
          </h1>
          <h3 className="text-xl md:text-2xl text-gray-400 font-medium mb-8 italic">The Design Domain, Done Right.</h3>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From concept to installation, we manage the entire lifecycle of furniture, fixtures, and equipment for hospitality, commercial, and residential projects.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?role=client"
              className="w-full sm:w-auto rounded-full bg-[var(--brand-red)] px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Get a Quote <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#services"
              className="w-full sm:w-auto rounded-full border border-gray-600 px-8 py-4 text-lg font-medium text-gray-300 hover:text-white hover:border-white transition-all"
            >
              Our Services
            </Link>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('/pattern.svg')]"></div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 bg-[var(--brand-white)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[var(--brand-red)] font-semibold text-sm uppercase tracking-wider mb-2">What We Do</h2>
            <h3 className="text-4xl font-bold text-[var(--brand-black)]">Our Core Services</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Service 1 */}
            <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-[var(--brand-beige)] rounded-lg flex items-center justify-center mb-6 text-white">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-bold text-[var(--brand-black)] mb-3">Furniture Procurement & Sourcing</h4>
              <p className="text-gray-600 leading-relaxed">
                Curated, cost-efficient selections tailored to each project.
              </p>
            </div>

            {/* Service 2 */}
            <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-[var(--brand-red)] rounded-lg flex items-center justify-center mb-6 text-white">
                <PenTool className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-bold text-[var(--brand-black)] mb-3">Design Consultation & Space Planning</h4>
              <p className="text-gray-600 leading-relaxed">
                Cohesive layouts that balance style and utility.
              </p>
            </div>

            {/* Service 3 */}
            <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-[var(--brand-black)] rounded-lg flex items-center justify-center mb-6 text-white">
                <Truck className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-bold text-[var(--brand-black)] mb-3">Logistics & Delivery Management</h4>
              <p className="text-gray-600 leading-relaxed">
                Coordinated shipping, installation, and setup.
              </p>
            </div>
            
            {/* Service 4 */}
            <div className="group p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-[var(--brand-beige)] rounded-lg flex items-center justify-center mb-6 text-white">
                <Users className="h-6 w-6" /> {/* Reusing Users icon or can pick another */}
              </div>
              <h4 className="text-xl font-bold text-[var(--brand-black)] mb-3">Vendor & Supply Chain Management</h4>
              <p className="text-gray-600 leading-relaxed">
                Nationwide access to trusted manufacturers and distributors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 px-6 bg-[var(--brand-beige)] text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-2 text-white/80">About Us</h2>
            <h3 className="text-4xl font-bold mb-6">Design Domain LLC</h3>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Design Domain LLC is a full-service furniture procurement and design firm specializing in furnishing solutions for multifamily developments, small businesses, and real estate professionals. Founded through a partnership between NREUV Advisors and DakJen Creative LLC, Design Domain combines large-scale industry expertise with boutique-level attention to detail.
            </p>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              We manage every aspect of the process—from sourcing and logistics to installation and design placement—ensuring each project is efficient, cohesive, and tailored to client needs. Whether furnishing entire apartment communities or curating spaces for boutique offices and staged units, our team delivers elevated, cost-effective solutions that align with both design vision and development timelines. Design Domain LLC provides end-to-end furniture procurement and design solutions for developers, businesses, and real estate professionals. We manage every phase of the furnishing process with precision, style, and efficiency.
            </p>
          </div>
          <div className="md:w-1/2 relative h-96 w-full rounded-2xl overflow-hidden">
            <Image
              src="/hough1.jpg" // Assuming hough1.jpg is in the public directory
              alt="Interior space design"
              fill
              className="object-cover rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[var(--brand-black)] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to bring your vision to life?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust DesignDomain for their FF&E needs. Start your project today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            
            <Link
              href="/register?role=contractor"
              className="inline-flex items-center justify-center rounded-full border border-gray-600 px-8 py-4 text-lg font-medium text-gray-300 hover:text-white hover:border-white transition-all"
            >
              Sign Up as Contractor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--brand-black)] text-gray-400 py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-bold text-white tracking-tight">
            Design<span className="text-[var(--brand-beige)]">Domain</span>
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} DesignDomain. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
