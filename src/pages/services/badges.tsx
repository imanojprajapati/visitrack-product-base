'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DigitalBadges = () => {
  const [mounted, setMounted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

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

  const badgeFeatures = [
    {
      title: 'Professional Templates',
      description: 'Choose from dozens of professionally designed badge templates or create your own.',
      icon: '🎨',
      benefits: ['50+ Templates', 'Custom Branding', 'Logo Integration']
    },
    {
      title: 'Real-time Printing',
      description: 'Print badges instantly during check-in with high-quality thermal or inkjet printers.',
      icon: '🖨️',
      benefits: ['Instant Print', 'High Quality', 'Multiple Formats']
    },
    {
      title: 'QR Code Integration',
      description: 'Automatically generate unique QR codes for each attendee for easy scanning.',
      icon: '📱',
      benefits: ['Unique QR Codes', 'Fast Scanning', 'Secure Access']
    },
    {
      title: 'Custom Fields',
      description: 'Add custom information fields like job title, company, or special designations.',
      icon: '📝',
      benefits: ['Custom Fields', 'Variable Data', 'Role-based Design']
    },
    {
      title: 'Security Features',
      description: 'Add security elements like holograms, special colors, or access levels.',
      icon: '🔒',
      benefits: ['Access Control', 'Security Elements', 'Anti-counterfeiting']
    },
    {
      title: 'Multi-format Export',
      description: 'Export badges in various formats for different printing requirements.',
      icon: '📄',
      benefits: ['PDF Export', 'PNG/JPG', 'Print Ready']
    }
  ];

  const badgeTemplates = [
    {
      name: 'Corporate Professional',
      description: 'Clean, professional design perfect for business conferences',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      features: ['Company Logo', 'Job Title', 'QR Code', 'Color Coding']
    },
    {
      name: 'Creative Event',
      description: 'Vibrant and creative design for workshops and creative events',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      features: ['Custom Graphics', 'Bright Colors', 'Creative Fonts', 'Social Media']
    },
    {
      name: 'Academic Conference',
      description: 'Professional academic design with institutional branding',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
      features: ['Institution Logo', 'Department', 'Academic Title', 'Conference Info']
    }
  ];

  const printingSpecs = [
    { spec: 'Print Size', value: '3.5" x 2.25" (Credit Card Size)' },
    { spec: 'Print Quality', value: '300 DPI High Resolution' },
    { spec: 'Print Speed', value: '10-15 badges per minute' },
    { spec: 'Paper Types', value: 'PVC, Cardstock, Synthetic' },
    { spec: 'Printer Support', value: 'Zebra, Evolis, Magicard' },
    { spec: 'Color Options', value: 'Full Color, Monochrome' }
  ];

  return (
    <div className="min-h-screen">
      <Head>
        <title>Digital Badges - Visitrack</title>
        <meta name="description" content="Create professional digital badges with custom templates, real-time printing, and QR code integration" />
      </Head>

      {/* Hero Section */}
      <div className="relative h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
          alt="Digital Badges"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Digital Badges
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-6">
              Professional digital badges with custom templates and instant printing
            </p>
            <Link href="/demo">
              <Button size="lg" className="text-lg px-8 py-3">Design Badges</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Professional Badge Creation
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Everything you need to create, customize, and print professional event badges
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {badgeFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mb-4">
                  {feature.description}
                </CardDescription>
                <div className="space-y-1">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Template Showcase */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Badge Templates
            </h2>
            <p className="text-lg text-gray-500">
              Choose from professionally designed templates or create your own
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {badgeTemplates.map((template, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  selectedTemplate === index ? 'ring-2 ring-indigo-500 shadow-lg' : ''
                }`}
                onClick={() => setSelectedTemplate(index)}
              >
                <div className="relative h-64">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {template.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Printing Specifications */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Professional Printing Standards
          </h2>
          <p className="text-lg text-gray-500">
            High-quality printing with professional-grade equipment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printingSpecs.map((spec, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="font-semibold text-gray-900 mb-2">{spec.spec}</div>
              <div className="text-gray-600">{spec.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge Workflow */}
      <div className="bg-indigo-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              How Badge Creation Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Template', desc: 'Select from our library or upload your design' },
              { step: '2', title: 'Customize Design', desc: 'Add your branding, colors, and information fields' },
              { step: '3', title: 'Import Data', desc: 'Upload attendee data or sync with registration' },
              { step: '4', title: 'Print & Distribute', desc: 'Print badges on-demand during check-in' }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-600 text-white text-xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-indigo-300"></div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to Create Professional Badges?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Start designing beautiful badges for your next event
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Try Badge Designer
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 bg-transparent text-white border-white hover:bg-white/10">
                Get Custom Template
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalBadges; 