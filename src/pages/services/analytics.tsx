'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EventAnalytics = () => {
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

  const analyticsFeatures = [
    {
      title: 'Real-time Dashboard',
      description: 'Monitor your event metrics as they happen with live, interactive dashboards.',
      icon: '📊',
      metrics: ['Live Attendance', 'Registration Rate', 'Check-in Status']
    },
    {
      title: 'Attendance Tracking',
      description: 'Track attendance patterns, peak times, and session popularity.',
      icon: '👥',
      metrics: ['Hourly Trends', 'Session Analytics', 'No-show Rate']
    },
    {
      title: 'Demographics Analysis',
      description: 'Understand your audience with detailed demographic breakdowns.',
      icon: '📈',
      metrics: ['Age Groups', 'Geographic Data', 'Industry Sectors']
    },
    {
      title: 'Engagement Metrics',
      description: 'Measure attendee engagement and interaction throughout your event.',
      icon: '💡',
      metrics: ['Session Duration', 'Interaction Rate', 'Feedback Scores']
    },
    {
      title: 'ROI Analysis',
      description: 'Calculate your event ROI with comprehensive financial analytics.',
      icon: '💰',
      metrics: ['Revenue per Attendee', 'Cost Analysis', 'Profit Margins']
    },
    {
      title: 'Export & Reporting',
      description: 'Generate detailed reports and export data in multiple formats.',
      icon: '📋',
      metrics: ['PDF Reports', 'CSV Export', 'API Access']
    }
  ];

  const dashboardPreviews = [
    {
      title: 'Registration Overview',
      description: 'Track registration progress and conversion rates',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Attendance Analytics',
      description: 'Real-time check-in data and attendance patterns',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Engagement Insights',
      description: 'Session popularity and attendee engagement metrics',
      image: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="min-h-screen">
      <Head>
        <title>Event Analytics - Visitrack</title>
        <meta name="description" content="Get instant insights into your event performance with real-time analytics, attendance tracking, and detailed reporting" />
      </Head>

      {/* Hero Section */}
      <div className="relative h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
          alt="Event Analytics"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Event Analytics
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-6">
              Get instant insights into your event performance with real-time analytics
            </p>
            <Link href="/demo">
              <Button size="lg" className="text-lg px-8 py-3">View Demo</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Comprehensive Event Analytics
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Make data-driven decisions with powerful analytics and insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {analyticsFeatures.map((feature, index) => (
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
                  {feature.metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {metric}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dashboard Preview Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Interactive Dashboards
            </h2>
            <p className="text-lg text-gray-500">
              Beautiful, intuitive dashboards that make complex data easy to understand
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {dashboardPreviews.map((dashboard, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-48">
                  <Image
                    src={dashboard.image}
                    alt={dashboard.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{dashboard.title}</CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Key Metrics You Can Track
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600 mb-2">Registration Rate</div>
            <p className="text-gray-600">Track conversion from views to registrations</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg">
            <div className="text-3xl font-bold text-emerald-600 mb-2">Attendance Rate</div>
            <p className="text-gray-600">Monitor actual vs. registered attendance</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg">
            <div className="text-3xl font-bold text-violet-600 mb-2">Engagement Score</div>
            <p className="text-gray-600">Measure attendee interaction and feedback</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg">
            <div className="text-3xl font-bold text-amber-600 mb-2">ROI Calculation</div>
            <p className="text-gray-600">Calculate your event return on investment</p>
          </div>
        </div>
      </div>

      {/* Integration Section */}
      <div className="bg-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-lg text-gray-500 mb-8">
              Connect with your favorite tools and platforms
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {['Google Analytics', 'Salesforce', 'HubSpot', 'Mailchimp', 'Slack', 'Microsoft Teams'].map((integration, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-2xl font-semibold text-gray-700">{integration}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Start Making Data-Driven Decisions
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Transform your event data into actionable insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                View Analytics Demo
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 bg-transparent text-white border-white hover:bg-white/10">
                Get Custom Report
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics; 