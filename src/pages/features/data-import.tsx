'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

const DataImportFeature = () => {
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

  const features = [
    {
      title: '100MB File Capacity',
      description: 'Import massive datasets with up to 500,000+ records in a single operation. Perfect for enterprise-scale events.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 8a5 5 0 01-1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      badge: '500K+ Records'
    },
    {
      title: 'Smart Column Mapping',
      description: 'Intelligent auto-detection of column headers with manual override capability. Map any file column to any database field.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      badge: 'AI-Powered'
    },
    {
      title: 'Multiple Format Support',
      description: 'Support for CSV, Excel (.xlsx, .xls) with intelligent parsing and automatic delimiter detection.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: 'CSV & Excel'
    },
    {
      title: 'Real-time Validation',
      description: 'Instant data validation, duplicate detection, and error reporting during the import process.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: 'Instant'
    },
    {
      title: 'Preview & Confirm',
      description: 'See exactly what will be imported with sample data preview and mapping confirmation before processing.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      badge: 'Live Preview'
    },
    {
      title: 'Enterprise Security',
      description: 'Secure file handling with automatic cleanup, encryption in transit, and role-based access control.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      badge: 'Secure'
    }
  ];

  const performanceMetrics = [
    {
      title: 'Processing Speed',
      value: '1-2 sec',
      description: 'Per 1,000 records'
    },
    {
      title: 'File Size Limit',
      value: '100MB',
      description: 'Maximum capacity'
    },
    {
      title: 'Data Accuracy',
      value: '99.9%',
      description: 'Validation accuracy'
    },
    {
      title: 'Success Rate',
      value: '98%',
      description: 'Import completion'
    }
  ];

  const supportedFields = [
    'Full Name', 'Email Address', 'Phone Number', 'Company', 'Job Title',
    'City', 'State/Province', 'Country', 'Postal Code', 'Custom Fields'
  ];

  return (
    <div className="min-h-screen">
      <Head>
        <title>Enterprise Data Import - 100MB Capacity | VisiTrack</title>
        <meta name="description" content="Import massive datasets up to 100MB with intelligent column mapping, real-time validation, and enterprise-grade security. Perfect for large-scale events." />
      </Head>

      {/* Hero Section */}
      <div className="relative h-[600px] w-full bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full mb-6">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                ENTERPRISE FEATURE
              </div>
              <h1 className="text-4xl md:text-7xl font-bold text-white mb-6">
                100MB Data Import
                <span className="block text-purple-300 text-3xl md:text-5xl mt-4">
                  Enterprise-Grade Processing
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-4xl mx-auto">
                Import massive visitor datasets with intelligent column mapping, real-time validation, 
                and lightning-fast processing. Handle 500,000+ records in minutes, not hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/demo" className="visitrack-button text-lg px-8 py-4">
                  Try Demo Import
                </Link>
                <Link href="/admin/reports" className="btn-secondary text-lg px-8 py-4">
                  Access Import Tool
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Cards Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-20 bg-white/10 backdrop-blur-sm rounded-lg animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-16 bg-purple-500/20 backdrop-blur-sm rounded-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-28 h-18 bg-blue-500/20 backdrop-blur-sm rounded-lg animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Enterprise Performance
            </h2>
            <p className="text-lg text-gray-600">
              Built for scale with industry-leading performance metrics
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {metric.value}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {metric.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
            Advanced Import Capabilities
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive tools designed for enterprise-scale data migration and management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                  {feature.icon}
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-gray-600">
              From upload to completion in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h3>
              <p className="text-gray-600">Drag & drop or select your CSV/Excel file up to 100MB</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Columns</h3>
              <p className="text-gray-600">AI suggests mappings or manually map file columns to database fields</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview & Validate</h3>
              <p className="text-gray-600">Review sample data and validate mappings before processing</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold mx-auto mb-6">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Complete</h3>
              <p className="text-gray-600">Data instantly available in your Center DB with full audit trail</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Fields */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
            Supported Data Fields
          </h2>
          <p className="text-xl text-gray-600">
            Map your data to any of these standard or custom fields
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {supportedFields.map((field, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
              <span className="text-gray-800 font-medium">{field}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Plus unlimited custom fields to capture any additional data specific to your events.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready for Enterprise-Scale Data Import?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join enterprise customers processing millions of records with VisiTrack's powerful import system.
          </p>
          <div className="flex justify-center">
            <Link href="/demo" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl">
              Get Free Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportFeature; 