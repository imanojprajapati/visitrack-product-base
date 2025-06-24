'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const CheckinManagement = () => {
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
      title: 'QR Code Scanning',
      description: 'Fast and accurate QR code scanning for instant attendee check-in with mobile devices.',
      icon: '📱',
      stats: '< 2 seconds'
    },
    {
      title: 'Real-time Dashboard',
      description: 'Monitor attendance in real-time with live updates and comprehensive analytics.',
      icon: '📊',
      stats: 'Live Updates'
    },
    {
      title: 'Offline Mode',
      description: 'Continue checking in attendees even without internet connection.',
      icon: '🔄',
      stats: '100% Uptime'
    },
    {
      title: 'Badge Printing',
      description: 'Print professional name badges on-site with customizable templates.',
      icon: '🏷️',
      stats: 'Instant Print'
    },
    {
      title: 'Multi-device Support',
      description: 'Use multiple devices simultaneously for faster check-in at large events.',
      icon: '📲',
      stats: 'Unlimited Devices'
    },
    {
      title: 'Contact Tracing',
      description: 'Built-in contact tracing features for health and safety compliance.',
      icon: '🛡️',
      stats: 'GDPR Compliant'
    }
  ];

  const checkInFlow = [
    {
      step: '1',
      title: 'Scan QR Code',
      description: 'Attendee presents their QR code ticket or registration confirmation'
    },
    {
      step: '2',
      title: 'Instant Verification',
      description: 'System verifies registration details and checks attendee in automatically'
    },
    {
      step: '3',
      title: 'Print Badge',
      description: 'Generate and print a professional name badge with event branding'
    },
    {
      step: '4',
      title: 'Real-time Update',
      description: 'Attendance data is updated instantly across all connected devices'
    }
  ];

  return (
    <div className="min-h-screen">
      <Head>
        <title>Check-in Management - Visitrack</title>
        <meta name="description" content="Streamline event check-ins with QR code scanning, real-time tracking, and instant badge printing" />
      </Head>

      {/* Hero Section */}
      <div className="relative h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
          alt="Check-in Management"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Check-in Management
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-6">
              Effortless event check-ins with QR code scanning and real-time tracking
            </p>
            <Link href="/demo">
              <Button size="lg" className="text-lg px-8 py-3">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Powerful Check-in Features
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Everything you need for fast, efficient, and professional event check-ins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {feature.stats}
                  </span>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Check-in Flow Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              How Check-in Works
            </h2>
            <p className="text-lg text-gray-500">
              Simple 4-step process for smooth attendee check-ins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {checkInFlow.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-600 text-white text-xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  {index < checkInFlow.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gray-300"></div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Trusted by Event Organizers Worldwide
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2">50K+</div>
            <div className="text-gray-500">Events Managed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2">2M+</div>
            <div className="text-gray-500">Check-ins Processed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2">99.9%</div>
            <div className="text-gray-500">Uptime</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2">&lt; 2s</div>
            <div className="text-gray-500">Average Check-in Time</div>
          </div>
        </div>
      </div>

      {/* Device Compatibility Section */}
      <div className="bg-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Works on Any Device
            </h2>
            <p className="text-lg text-gray-500">
              Use smartphones, tablets, or dedicated scanners for maximum flexibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="text-5xl mb-4">📱</div>
                <CardTitle>Mobile Phones</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Turn any smartphone into a powerful check-in station with our mobile app
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="text-5xl mb-4">💻</div>
                <CardTitle>Tablets & Laptops</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Use tablets and laptops for larger screens and better visibility during check-ins
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="text-5xl mb-4">🔍</div>
                <CardTitle>Dedicated Scanners</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Integrate with professional barcode scanners for high-volume events
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to Streamline Your Check-ins?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of event organizers who've made check-ins effortless with Visitrack
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Request Demo
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 bg-transparent text-white border-white hover:bg-white/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckinManagement; 