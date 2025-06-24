'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import VideoBackground from '../components/VideoBackground';
import { Event } from '../types/event';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface Client {
  name: string;
  logo: string;
}

const Home = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [features, setFeatures] = useState<Feature[]>([
    {
      title: 'Easy Registration',
      description: 'Streamline your event registration process with our user-friendly platform.',
      icon: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    },
    {
      title: 'Real-time Analytics',
      description: 'Get instant insights into your event attendance and engagement.',
      icon: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    },
    {
      title: 'Quick Check-in',
      description: 'Efficient check-in process with QR code scanning and digital badges.',
      icon: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    },
  ]);

  const [clients, setClients] = useState<Client[]>([
    { 
      name: 'Google', 
      logo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    },
    { 
      name: 'Amazon', 
      logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    },
    { 
      name: 'Apple', 
      logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    },
    { 
      name: 'Microsoft', 
      logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    },
    { 
      name: 'Meta', 
      logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    },
    { 
      name: 'Netflix', 
      logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
    },
  ]);

  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [openFAQs, setOpenFAQs] = useState<boolean[]>([false, false, false, false]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogContent, setDialogContent] = useState('');

  const toggleFAQ = (index: number) => {
    setOpenFAQs(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const showModal = (title: string, content: string) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogOpen(true);
  };

  useEffect(() => {
    setMounted(true);
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      console.log('Fetching all events for home page...');
      const response = await fetch('/api/events?admin=true');
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      console.log('Fetched events:', data);
      console.log('Number of events:', data.length);
      // Handle new API response format with events and pagination
      const eventsData = data.events || data;
      // Filter out draft events for public display
      const filteredEvents = Array.isArray(eventsData) 
        ? eventsData.filter(event => event.status !== 'draft')
        : [];
      setEvents(filteredEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load upcoming events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = (event: Event) => {
    const now = new Date();
    let registrationDeadline = null;
    
    // Check if event is cancelled
    if (event.status === 'cancel') {
      showModal('Event Cancelled', 'This event has been cancelled. Registration is not available.');
      return;
    }
    
    // Parse registration deadline if it exists
    if (event.registrationDeadline) {
      try {
        // Parse DD-MM-YYYY format to Date object
        const [day, month, year] = event.registrationDeadline.split('-').map(Number);
        registrationDeadline = new Date(year, month - 1, day);
      } catch (error) {
        console.error('Error parsing registration deadline:', error);
      }
    }
    
    // Check if registration deadline has passed
    if (registrationDeadline && now > registrationDeadline) {
      showModal('Registration Closed', 'You are able to register for this event at the event location and event date with pay to entry badge.');
      return;
    }
    
    // If registration is still open, proceed to registration page
    window.location.href = `/events/${event._id}/register`;
  };

  const isRegistrationClosed = (event: Event) => {
    const now = new Date();
    let registrationDeadline = null;
    
    // Parse registration deadline if it exists
    if (event.registrationDeadline) {
      try {
        // Parse DD-MM-YYYY format to Date object
        const [day, month, year] = event.registrationDeadline.split('-').map(Number);
        registrationDeadline = new Date(year, month - 1, day);
      } catch (error) {
        console.error('Error parsing registration deadline:', error);
      }
    }
    
    return registrationDeadline && now > registrationDeadline;
  };

  // Helper function to categorize events
  const categorizeEvents = (events: Event[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const upcoming: Event[] = [];
    const ongoing: Event[] = [];
    const past: Event[] = [];
    
    events.forEach(event => {
      try {
        // Parse event dates (DD-MM-YYYY format)
        const [startDay, startMonth, startYear] = event.startDate.split('-').map(Number);
        const [endDay, endMonth, endYear] = event.endDate.split('-').map(Number);
        
        const eventStartDate = new Date(startYear, startMonth - 1, startDay);
        const eventEndDate = new Date(endYear, endMonth - 1, endDay);
        
        if (eventStartDate > today) {
          upcoming.push(event);
        } else if (eventEndDate >= today) {
          ongoing.push(event);
        } else {
          past.push(event);
        }
      } catch (error) {
        console.error('Error parsing event date:', error);
        // If date parsing fails, treat as upcoming
        upcoming.push(event);
      }
    });
    
    // Sort each category by start date (ascending order)
    const sortByDate = (a: Event, b: Event) => {
      try {
        const [aDay, aMonth, aYear] = a.startDate.split('-').map(Number);
        const [bDay, bMonth, bYear] = b.startDate.split('-').map(Number);
        const aDate = new Date(aYear, aMonth - 1, aDay);
        const bDate = new Date(bYear, bMonth - 1, bDay);
        return aDate.getTime() - bDate.getTime();
      } catch (error) {
        return 0;
      }
    };
    
    return { 
      upcoming: upcoming.sort(sortByDate), 
      ongoing: ongoing.sort(sortByDate), 
      past: past.sort(sortByDate) 
    };
  };

  const { upcoming, ongoing, past } = categorizeEvents(events);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Visitrack - Streamline Your Events</title>
        <meta name="description" content="Streamline your events with Visitrack. Easy registration, check-in, and analytics in one platform." />
      </Head>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <VideoBackground />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Streamline Your Events with Visitrack
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Simplify event management with our all-in-one platform. From registration to analytics, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link href="/events" className="btn btn-outline text-white border-white hover:bg-white/10">
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          Events
        </h2>
        {isLoading ? (
          <div className="text-center">Loading events...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-500">No events found</div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {upcoming.slice(0, 6).map((event) => (
                    <div
                      key={event._id}
                      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      {event.banner && (
                        <div className="relative h-64">
                          <Image
                            src={event.banner}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Upcoming
                          </span>
                          <span className="text-sm text-gray-500">
                            {event.startDate} - {event.endDate}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{event.location}</p>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        {event.registrationDeadline && (
                          <p className="text-gray-500 text-sm mb-2">
                            Registration Deadline: {event.registrationDeadline}
                          </p>
                        )}
                        {event.status === 'cancelled' ? (
                          <button
                            onClick={() => handleRegisterClick(event)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                          >
                            Event Cancelled
                          </button>
                        ) : isRegistrationClosed(event) ? (
                          <button
                            onClick={() => handleRegisterClick(event)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                          >
                            Registration Closed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegisterClick(event)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4338CA] hover:bg-[#3730A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4338CA] cursor-pointer"
                          >
                            Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {upcoming.length > 6 && (
                  <div className="text-center mt-8">
                    <Link
                      href="/events"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#4338CA] hover:bg-[#3730A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4338CA]"
                    >
                      View All Events
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Ongoing Events */}
            {ongoing.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Ongoing Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {ongoing.slice(0, 3).map((event) => (
                    <div
                      key={event._id}
                      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      {event.banner && (
                        <div className="relative h-64">
                          <Image
                            src={event.banner}
                            alt={event.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Ongoing
                          </span>
                          <span className="text-sm text-gray-500">
                            {event.startDate} - {event.endDate}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{event.location}</p>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        {event.registrationDeadline && (
                          <p className="text-gray-500 text-sm mb-2">
                            Registration Deadline: {event.registrationDeadline}
                          </p>
                        )}
                        <button
                          onClick={() => handleRegisterClick(event)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4338CA] hover:bg-[#3730A3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4338CA] cursor-pointer"
                        >
                          Register Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-64">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Trusted by Leading Companies
          </h2>
          <div className="relative">
            <div className="flex space-x-8 animate-scroll">
              {clients.concat(clients).map((client, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-48 h-24 bg-white rounded-lg shadow-md flex items-center justify-center client-logo"
                >
                  <Image
                    src={client.logo}
                    alt={client.name}
                    width={120}
                    height={60}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              question: "How do I create an event?",
              answer: "Simply sign up for an account and click on 'Create Event' in your dashboard. Fill out the event details and you're ready to go!"
            },
            {
              question: "Can I customize registration forms?",
              answer: "Yes! You can create custom registration forms with fields that are specific to your event needs."
            },
            {
              question: "Is there a mobile app?",
              answer: "Currently, our platform is web-based and mobile responsive. A native mobile app is in development."
            },
            {
              question: "What analytics are available?",
              answer: "You get comprehensive analytics including registration numbers, check-in rates, demographics, and real-time event statistics."
            }
          ].map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md">
              <button
                className="w-full px-6 py-4 text-left focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${openFAQs[index] ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div
                className={`faq-answer overflow-hidden transition-all duration-300 ${
                  openFAQs[index] ? 'max-h-96 pb-4' : 'max-h-0'
                }`}
              >
                <p className="px-6 text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#4f46e5]">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of event organizers who trust Visitrack for their events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-[#4f46e5] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Request Demo
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>

      {/* Dialog for Modal Replacement */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogContent}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Home; 