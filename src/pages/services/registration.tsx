'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EventRegistration = () => {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    organizerName: '',
    email: '',
    phone: '',
    eventType: '',
    expectedAttendees: '',
    eventDate: '',
    venue: '',
    description: '',
    requirements: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

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
      title: 'Custom Registration Forms',
      description: 'Create personalized registration forms with custom fields tailored to your event needs.',
      icon: '📝'
    },
    {
      title: 'Real-time Registration Tracking',
      description: 'Monitor registrations as they happen with live updates and comprehensive analytics.',
      icon: '📊'
    },
    {
      title: 'Payment Integration',
      description: 'Seamlessly integrate with popular payment gateways for paid events.',
      icon: '💳'
    },
    {
      title: 'Automated Confirmations',
      description: 'Send automatic confirmation emails and tickets to registered attendees.',
      icon: '✉️'
    },
    {
      title: 'Waitlist Management',
      description: 'Manage waiting lists for sold-out events and automatically notify when spots open.',
      icon: '⏳'
    },
    {
      title: 'Mobile Optimized',
      description: 'Fully responsive registration forms that work perfectly on all devices.',
      icon: '📱'
    }
  ];

  return (
    <div className="min-h-screen">
      <Head>
        <title>Event Registration - Visitrack</title>
        <meta name="description" content="Streamline your event registration process with custom forms, real-time tracking, and automated confirmations" />
      </Head>

      {/* Hero Section */}
      <div className="relative h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
          alt="Event Registration"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Event Registration
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-6">
              Streamline your event registration process with powerful, customizable forms
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
            Powerful Registration Features
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Everything you need to create, manage, and optimize your event registration process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
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

      {/* Registration Demo Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Request Registration Setup
            </h2>
            <p className="text-lg text-gray-500">
              Let us help you set up the perfect registration system for your event
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Registration Request</CardTitle>
              <CardDescription>
                Fill out this form and we'll create a custom registration system for your event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name *</Label>
                    <Input
                      id="eventName"
                      name="eventName"
                      type="text"
                      required
                      value={formData.eventName}
                      onChange={handleInputChange}
                      placeholder="Enter your event name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizerName">Organizer Name *</Label>
                    <Input
                      id="organizerName"
                      name="organizerName"
                      type="text"
                      required
                      value={formData.organizerName}
                      onChange={handleInputChange}
                      placeholder="Your name or organization"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type</Label>
                    <Input
                      id="eventType"
                      name="eventType"
                      type="text"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      placeholder="Conference, Workshop, Seminar, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                    <Input
                      id="expectedAttendees"
                      name="expectedAttendees"
                      type="number"
                      value={formData.expectedAttendees}
                      onChange={handleInputChange}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      name="venue"
                      type="text"
                      value={formData.venue}
                      onChange={handleInputChange}
                      placeholder="Event venue location"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Event Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of your event"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Special Requirements</Label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    placeholder="Any specific registration form fields or requirements"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="lg">
                    Submit Registration Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Why Choose Our Registration System?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-500">
              Quick setup with pre-built templates and drag-and-drop form builder
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Highly Secure</h3>
            <p className="text-gray-500">
              SSL encryption and secure data handling to protect attendee information
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
            <p className="text-gray-500">
              Round-the-clock support to ensure your registration process runs smoothly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRegistration; 