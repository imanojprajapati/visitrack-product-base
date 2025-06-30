'use client';

import Head from 'next/head';
import Link from 'next/link';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Terms of Service - VisiTrack</title>
        <meta name="description" content="VisiTrack Terms of Service - Learn about the terms and conditions for using our event management platform." />
      </Head>

      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                By accessing and using VisiTrack's services, you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                VisiTrack provides event management software and related services including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Event registration and ticketing</li>
                <li>Attendee management and check-in systems</li>
                <li>Analytics and reporting tools</li>
                <li>Digital badge creation and printing</li>
                <li>Data import and management capabilities</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                To use certain features of our service, you must register for an account. You are responsible for maintaining 
                the confidentiality of your account and password and for restricting access to your computer.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <div className="space-y-4 text-gray-700">
              <p>You agree not to use the service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload, post, or transmit any content that is unlawful, harmful, or offensive</li>
                <li>Violate any applicable local, state, national, or international law</li>
                <li>Interfere with or disrupt the service or servers connected to the service</li>
                <li>Attempt to gain unauthorized access to any portion of the service</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data and Privacy</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, 
                to understand our practices.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Paid services are billed in advance on a monthly or annual basis and are non-refundable. 
                We reserve the right to change our pricing at any time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                In no event shall VisiTrack be liable for any direct, indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of or inability to use the service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We may terminate or suspend your account and bar access to the service immediately, without prior notice, 
                if you breach these Terms of Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
            <div className="space-y-4 text-gray-700">
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> visitrackinfo@gmail.com</p>
                <p><strong>Address:</strong> A-407, Ganesh Glory 11 Nr.Bsnl Office, SG highway Jagatpur, Road, Gota, Ahmedabad, Gujarat 382470</p>
                <p><strong>Phone:</strong> +91 97277 72798</p>
              </div>
            </div>
          </section>

        </div>

        <div className="mt-8 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
            ← Back to Home
          </Link>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="text-blue-600 hover:text-blue-700 underline">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 