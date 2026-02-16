import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--brand-white)] text-gray-900 font-sans p-6">
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-gray-600 hover:text-[var(--brand-red)] transition-colors">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Link>
      </div>
      <div className="max-w-7xl mx-auto py-16">
        <h1 className="text-4xl font-bold text-[var(--brand-black)] mb-8 text-center">About Design Domain LLC</h1>
        
        <section className="py-12 px-6 bg-[var(--brand-beige)] text-white rounded-xl shadow-lg mb-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2 text-white/80">Our Story & Mission</h2>
              <h3 className="text-4xl font-bold mb-6">Elevating Spaces, Redefining Procurement.</h3>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                Design Domain LLC was founded by Dr. Gina Merritt of NREUV Advisors and Dakotah Jennifer of DakJen Creative LLC, uniting expertise in real estate development and design operations. Together, they lead a firm built on efficiency, creativity, and client-focused execution—delivering exceptional furnishing solutions for developers, businesses, and property owners.
              </p>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                We manage every aspect of the process—from sourcing and logistics to installation and design placement—ensuring each project is efficient, cohesive, and tailored to client needs. Whether furnishing entire apartment communities or curating spaces for boutique offices and staged units, our team delivers elevated, cost-effective solutions that align with both design vision and development timelines. Design Domain LLC provides end-to-end furniture procurement and design solutions for developers, businesses, and real estate professionals. We manage every phase of the furnishing process with precision, style, and efficiency.
              </p>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                We understand that procurement is more than just buying furniture. It&apos;s about translating a design vision into reality, on time and on budget.
              </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-[var(--brand-black)] mt-1 flex-shrink-0" />
                <p>Global supplier network with exclusive trade pricing.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-[var(--brand-black)] mt-1 flex-shrink-0" />
                <p>Dedicated project managers for every account.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-[var(--brand-black)] mt-1 flex-shrink-0" />
                <p>Transparent, real-time tracking through our client portal.</p>
              </div>
            </div>
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

        {/* Image Section hough2.jpg */}
        <section className="relative w-full h-96 my-12 rounded-xl overflow-hidden shadow-lg">
          <Image
            src="/hough2.jpg" // Assuming hough2.jpg is in the public directory
            alt="Interior design example"
            fill
            className="object-cover"
          />
        </section>

        <section className="py-12 px-6 bg-[var(--brand-black)] text-white rounded-xl shadow-lg mt-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Meet Our Team</h2>
          <p className="text-lg text-gray-300 mb-8 text-center max-w-2xl mx-auto">
            Our dedicated team brings a wealth of experience in design, procurement, and project management to ensure your vision is realized seamlessly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mx-auto">
            {/* Team Member 1: Gina Merritt */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center max-w-sm mx-auto">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-[var(--brand-red)]">
                <Image
                  src="/ginamerrittheadshot4.png" // Updated image name
                  alt="Gina Merritt Headshot"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-[var(--brand-black)]">Dr. Gina Merritt</h3>
              <p className="text-lg text-gray-600">Co-Founder</p>
              <p className="text-base text-gray-500 mt-1">Principal of NREUV</p>
              <p className="text-base text-gray-500 mt-2">Expertise in real estate development and operations.</p>
            </div>

            {/* Team Member 2: Dakotah Jennifer */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center max-w-sm mx-auto">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-[var(--brand-beige)]">
                <Image
                  src="/dakotahj-headshot.png" // Actual headshot
                  alt="Dakotah Jennifer Headshot"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-[var(--brand-black)]">Dakotah Jennifer</h3>
              <p className="text-lg text-gray-600">Co-Founder</p>
              <p className="text-base text-gray-500 mt-1">CEO of DakJen Creative LLC</p>
              <p className="text-base text-gray-500 mt-2">Expertise in design operations and creative execution.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}