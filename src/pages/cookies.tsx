'use client';

import Head from 'next/head';
import Link from 'next/link';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Cookie Policy - VisiTrack</title>
        <meta name="description" content="VisiTrack Cookie Policy - Learn about how we use cookies and similar technologies." />
      </Head>

      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Cookies</h2>
            <div className="space-y-4 text-gray-700">
              <p>We use cookies for the following purposes:</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-6">Essential Cookies</h3>
              <p>These cookies are necessary for the website to function properly and cannot be disabled:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Authentication and security</li>
                <li>Session management</li>
                <li>Load balancing</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Analytics Cookies</h3>
              <p>These cookies help us understand how visitors use our website:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Page views and user behavior</li>
                <li>Performance monitoring</li>
                <li>Error tracking</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">Functional Cookies</h3>
              <p>These cookies enhance your experience on our website:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>User preferences</li>
                <li>Language settings</li>
                <li>Form data retention</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We may also use third-party services that place cookies on your device. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Google Analytics for website analytics</li>
                <li>Payment processors for secure transactions</li>
                <li>Content delivery networks for performance</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Cookies</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                You can control and manage cookies in various ways. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View what cookies are stored on your device</li>
                <li>Delete cookies individually or all at once</li>
                <li>Block cookies from specific websites</li>
                <li>Block all cookies from being set</li>
              </ul>
              
              <p className="mt-4">
                Please note that disabling cookies may affect the functionality of our website and limit your ability to use certain features.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Retention</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Cookies may be stored for different periods depending on their purpose:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent cookies:</strong> Remain until their expiry date or you delete them</li>
                <li><strong>Analytics cookies:</strong> Typically stored for 1-2 years</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We may update this Cookie Policy from time to time. Any changes will be posted on this page 
                with an updated revision date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <div className="space-y-4 text-gray-700">
              <p>If you have any questions about our use of cookies, please contact us:</p>
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
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy; 