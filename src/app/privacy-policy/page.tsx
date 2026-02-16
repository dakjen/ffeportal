import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[var(--brand-white)] text-gray-900 font-sans p-6">
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-gray-600 hover:text-[var(--brand-red)] transition-colors">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Link>
      </div>
      <div className="max-w-4xl mx-auto py-16">
        <h1 className="text-4xl font-bold text-[var(--brand-black)] mb-8 text-center">Privacy Policy</h1>
        
        <div className="prose prose-lg mx-auto"> {/* Using prose for better typography */}
            <p className="mb-4"><strong>Effective Date:</strong> February 15th, 2026</p>

            <p className="mb-6">This Privacy Policy describes how DesignDomain LLC ("we," "us," or "our") collects, uses, and discloses your information when you use our website (the "Service").</p>

            <h2 className="mt-8 mb-4 text-2xl font-bold">1. Information We Collect</h2>
            <p className="mb-4">We collect several types of information from and about users of our Service, including:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li><strong>Personal Information:</strong> This may include your name, email address, postal address, phone number, payment information (e.g., credit card details), and any other information you voluntarily provide to us.</li>
              <li><strong>Usage Data:</strong> We automatically collect information about how you access and use the Service. This Usage Data may include your computer's Internet Protocol (IP) address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.</li>
              <li><strong>Tracking Technologies and Cookies:</strong> We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</li>
            </ul>

            <h2 className="mt-8 mb-4 text-2xl font-bold">2. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for various purposes, including:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>To provide and maintain our Service.</li>
              <li>To notify you about changes to our Service.</li>
              <li>To allow you to participate in interactive features of our Service when you choose to do so.</li>
              <li>To provide customer support.</li>
              <li>To gather analysis or valuable information so that we can improve our Service.</li>
              <li>To monitor the usage of our Service.</li>
              <li>To detect, prevent, and address technical issues.</li>
              <li>To provide you with news, special offers, and general information about other goods, services, and events which we offer that are similar to those that you have already purchased or inquired about unless you have opted not to receive such information.</li>
              <li>To process your transactions and manage your orders.</li>
            </ul>

            <h2 className="mt-8 mb-4 text-2xl font-bold">3. Disclosure of Your Information</h2>
            <p className="mb-4">We may share your personal information in the following situations:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li><strong>With Service Providers:</strong> We may share your personal information with third-party service providers to monitor and analyze the use of our Service, to process payments, or to contact you.</li>
              <li><strong>For Business Transfers:</strong> We may share or transfer your personal information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              <li><strong>With Affiliates:</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include our parent company and any other subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.</li>
              <li><strong>With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
              <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your data in the good faith belief that such action is necessary to:
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li>Comply with a legal obligation.</li>
                  <li>Protect and defend the rights or property of DesignDomain LLC.</li>
                  <li>Prevent or investigate possible wrongdoing in connection with the Service.</li>
                  <li>Protect the personal safety of users of the Service or the public.</li>
                  <li>Protect against legal liability.</li>
                </ul>
              </li>
            </ul>

            <h2 className="mt-8 mb-4 text-2xl font-bold">4. Security of Your Information</h2>
            <p className="mb-4">The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>

            <h2 className="mt-8 mb-4 text-2xl font-bold">5. Your Data Protection Rights</h2>
            <p className="mb-4">Depending on your location, you may have certain data protection rights, including:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>The right to access, update or delete the information we have on you.</li>
              <li>The right of rectification.</li>
              <li>The right to object.</li>
              <li>The right of restriction.</li>
              <li>The right to data portability.</li>
              <li>The right to withdraw consent.</li>
            </ul>
            <p className="mb-4">If you wish to exercise any of these rights, please contact us.</p>

            <h2 className="mt-8 mb-4 text-2xl font-bold">6. Links to Other Websites</h2>
            <p className="mb-4">Our Service may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>

            <h2 className="mt-8 mb-4 text-2xl font-bold">7. Children's Privacy</h2>
            <p className="mb-4">Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Child has provided us with Personal Information, please contact us. If we become aware that we have collected Personal Information from children without verification of parental consent, we take steps to remove that information from our servers.</p>

            <h2 className="mt-8 mb-4 text-2xl font-bold">8. Changes to This Privacy Policy</h2>
            <p className="mb-4">We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

            <h2 className="mt-8 mb-4 text-2xl font-bold">9. Contact Us</h2>
            <p className="mb-4">If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>By email: quote@designdomainllc.com</li>
              <li>By visiting this page on our website: <Link href="/contact">Contact Us</Link></li>
              <li>By phone number: ‪(202) 600-9741‬</li>
            </ul>
        </div>
      </div>
    </div>
  );
}