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

const FeedbackCollection = () => {
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackForm, setFeedbackForm] = useState({
    eventName: '',
    organizerName: '',
    email: '',
    feedbackType: '',
    overallRating: 0,
    comments: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Feedback submitted:', feedbackForm);
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

  const feedbackFeatures = [
    {
      title: 'Custom Survey Builder',
      description: 'Create tailored feedback forms with drag-and-drop question builder.',
      icon: '📋',
      capabilities: ['Multiple Question Types', 'Conditional Logic', 'Custom Branding']
    },
    {
      title: 'Real-time Collection',
      description: 'Collect feedback during or immediately after your event sessions.',
      icon: '⚡',
      capabilities: ['Live Polling', 'Instant Responses', 'Mobile Optimized']
    },
    {
      title: 'Advanced Analytics',
      description: 'Analyze feedback data with powerful reporting and visualization tools.',
      icon: '📊',
      capabilities: ['Sentiment Analysis', 'Visual Reports', 'Export Options']
    },
    {
      title: 'Multiple Channels',
      description: 'Collect feedback through various channels and touchpoints.',
      icon: '📱',
      capabilities: ['QR Code Surveys', 'Email Campaigns', 'Social Integration']
    },
    {
      title: 'Automated Follow-ups',
      description: 'Send automated thank you messages and follow-up surveys.',
      icon: '🔄',
      capabilities: ['Email Automation', 'Drip Campaigns', 'Personalization']
    },
    {
      title: 'Integration Hub',
      description: 'Connect with your favorite CRM and marketing tools.',
      icon: '🔗',
      capabilities: ['CRM Sync', 'API Access', 'Webhook Support']
    }
  ];

  const questionTypes = [
    { type: 'Rating Scale', icon: '⭐', description: '1-5 or 1-10 star ratings' },
    { type: 'Multiple Choice', icon: '☑️', description: 'Single or multiple selection options' },
    { type: 'Text Response', icon: '💬', description: 'Open-ended text feedback' },
    { type: 'Yes/No', icon: '✅', description: 'Simple boolean questions' },
    { type: 'Ranking', icon: '📊', description: 'Rank items in order of preference' },
    { type: 'Matrix', icon: '📋', description: 'Rate multiple items on same scale' }
  ];

  const StarRating = ({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Head>
        <title>Feedback Collection - Visitrack</title>
        <meta name="description" content="Collect valuable feedback from event attendees with custom surveys, real-time analytics, and automated follow-ups" />
      </Head>

      {/* Hero Section */}
      <div className="relative h-[500px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
          alt="Feedback Collection"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Feedback Collection
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-6">
              Collect valuable insights from your attendees with smart feedback tools
            </p>
            <Link href="/demo">
              <Button size="lg" className="text-lg px-8 py-3">Start Collecting</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Comprehensive Feedback Solutions
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Everything you need to collect, analyze, and act on attendee feedback
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedbackFeatures.map((feature, index) => (
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
                  {feature.capabilities.map((capability, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {capability}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Question Types Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Flexible Question Types
            </h2>
            <p className="text-lg text-gray-500">
              Choose from various question formats to get the insights you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionTypes.map((type, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <CardTitle className="text-lg">{type.type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{type.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Sample Feedback Form */}
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Interactive Feedback Demo
          </h2>
          <p className="text-lg text-gray-500">
            Try our feedback form builder in action
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Feedback Form</CardTitle>
            <CardDescription>
              Help us improve by sharing your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    name="eventName"
                    value={feedbackForm.eventName}
                    onChange={handleInputChange}
                    placeholder="Which event did you attend?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizerName">Your Name</Label>
                  <Input
                    id="organizerName"
                    name="organizerName"
                    value={feedbackForm.organizerName}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={feedbackForm.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Overall Event Rating</Label>
                <div className="flex items-center space-x-4">
                  <StarRating rating={rating} setRating={setRating} />
                  <span className="text-sm text-gray-500">
                    {rating > 0 ? `${rating}/5 stars` : 'Select a rating'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  value={feedbackForm.comments}
                  onChange={handleInputChange}
                  placeholder="Share your thoughts about the event..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  Submit Feedback
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="bg-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Why Feedback Matters
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Improve Future Events</h3>
              <p className="text-gray-500">
                Use attendee insights to make your next event even better
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Increase Satisfaction</h3>
              <p className="text-gray-500">
                Show attendees you value their opinion and build loyalty
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Measure ROI</h3>
              <p className="text-gray-500">
                Quantify event success and demonstrate value to stakeholders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Start Collecting Valuable Feedback
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Transform attendee opinions into actionable insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Try Survey Builder
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-8 py-3 bg-transparent text-white border-white hover:bg-white/10">
                Get Custom Survey
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCollection; 