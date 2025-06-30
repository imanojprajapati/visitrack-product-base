'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

const Features = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="mt-4 h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const coreFeatures = [
    {
      title: 'Event Registration',
      description: 'Streamline your event registration process with custom forms, automated confirmations, and seamless user experience.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      href: '/features/registration',
      image: '/images/features/registration.jpg',
      highlights: ['Custom Forms', 'Automated Emails', 'Multi-Step Process', 'Payment Integration']
    },
    {
      title: 'Smart Check-in Management',
      description: 'Efficient check-in process with QR code scanning, real-time attendance tracking, and instant badge printing.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1zm12 0h2a1 1 0 001-1V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3a1 1 0 001 1zM5 20h2a1 1 0 001-1v-3a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1z" />
        </svg>
      ),
      href: '/features/checkin',
      image: '/images/features/checkin.jpg',
      highlights: ['QR Code Scanning', 'Real-time Tracking', 'Mobile Scanner', 'Instant Verification']
    },
    {
      title: 'Advanced Analytics',
      description: 'Get comprehensive insights into your event performance with detailed analytics, attendance patterns, and engagement metrics.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/features/analytics',
      image: '/images/features/analytics.jpg',
      highlights: ['Real-time Dashboards', 'Attendance Reports', 'Engagement Metrics', 'Export Capabilities']
    },
    {
      title: 'Digital Badge System',
      description: 'Professional digital badges with customizable templates, instant printing, and automated badge generation.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/features/badges',
      image: '/images/demo-banner.jpg',
      highlights: ['Custom Templates', 'Instant Printing', 'QR Integration', 'Brand Customization']
    }
  ];

  const enterpriseFeatures = [
    {
      title: 'Enterprise Data Import',
      description: 'Import massive datasets up to 100MB with intelligent column mapping, data validation, and real-time processing.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 8a5 5 0 01-1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      features: ['100MB File Capacity', 'Smart Column Mapping', 'CSV & Excel Support', 'Real-time Validation'],
      badge: 'ENTERPRISE'
    },
    {
      title: 'Role-Based Access Control',
      description: 'Comprehensive user management with granular permissions, multi-level access control, and security audit trails.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      features: ['User Hierarchies', 'Permission Matrix', 'Audit Logging', 'Multi-tenancy Support'],
      badge: 'SECURITY'
    },
    {
      title: 'External API Integration',
      description: 'Powerful REST APIs for external integrations, QR entry systems, and third-party platform connectivity.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      features: ['REST API Endpoints', 'Webhook Support', 'QR Entry API', 'Third-party Connectors'],
      badge: 'API'
    },
    {
      title: 'Advanced Messaging System',
      description: 'Multi-channel communication with email templates, SMS notifications, and automated messaging workflows.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      features: ['Email Templates', 'SMS Integration', 'Auto-reminders', 'Bulk Messaging'],
      badge: 'COMMUNICATION'
    }
  ];

  const additionalFeatures = [
    'Multi-event Management Dashboard',
    'Visitor Dataset Analytics',
    'Custom Form Builder',
    'Real-time Attendance Monitoring',
    'Automated Email Confirmations',
    'Mobile-responsive Design',
    'Cloud-based Infrastructure',
    'Data Export & Reporting',
    'Event Performance Metrics',
    'Secure Data Storage',
    'Multi-language Support',
    'White-label Solutions'
  ];

  return (
    <div className="min-h-screen">
      <Head>
        <title>Features - VisiTrack | Complete Event Management Platform</title>
        <meta name="description" content="Discover VisiTrack's comprehensive event management features including registration, check-in, analytics, data import, and enterprise-grade security." />
      </Head>

      {/* Hero Section */}
      <div className="relative h-[600px] w-full">
        <Image
          src="/images/hero-banner.jpg"
          alt="VisiTrack Features"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Powerful Features for
              <span className="block text-blue-400">Modern Events</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl">
              Everything you need to create, manage, and analyze successful events. 
              From registration to analytics, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/demo" className="visitrack-button text-lg px-8 py-4">
                Try All Features
              </Link>
              <Link href="/pricing" className="btn-secondary text-lg px-8 py-4">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
            Core Event Management Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform provides everything you need for seamless event management, 
            from initial registration to post-event analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {coreFeatures.map((feature, index) => (
            <Link key={index} href={feature.href} className="group">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative h-64">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm text-white mb-2">
                      {feature.icon}
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {feature.highlights.map((highlight, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-800 transition-colors">
                    Explore Feature
                    <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
              Enterprise-Grade Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced features designed for large-scale events and enterprise requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enterpriseFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    {feature.icon}
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    feature.badge === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                    feature.badge === 'SECURITY' ? 'bg-red-100 text-red-800' :
                    feature.badge === 'API' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Features Grid */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
            Complete Feature Set
          </h2>
          <p className="text-xl text-gray-600">
            Discover all the capabilities that make VisiTrack the complete event management solution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => (
            <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <svg className="h-5 w-5 text-green-500 mr-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-800 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to Experience All Features?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover how VisiTrack can transform your event management experience with powerful features and intuitive design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl">
              Get Free Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features; 