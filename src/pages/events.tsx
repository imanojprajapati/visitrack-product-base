'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Event } from '../types/event';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Header from '../components/Header';

const EventsPage = () => {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogContent, setDialogContent] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      console.log('Fetching all public events for events page...');
      const response = await fetch('/api/public-events');
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      console.log('Fetched events:', data);
      // Data is already filtered to exclude draft events
      const eventsData = Array.isArray(data) ? data : [];
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (title: string, content: string) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogOpen(true);
  };

  const handleRegisterClick = (event: Event) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let registrationDeadline = null;
    
    // Check if event is cancelled
    if (event.status === 'cancel') {
      showModal('Event Cancelled', 'This event has been cancelled. Registration is not available.');
      return;
    }
    
    // Parse registration deadline if it exists
    if (event.registrationDeadline) {
      try {
        // Parse YYYY-MM-DD format to Date object
        registrationDeadline = new Date(event.registrationDeadline);
      } catch (error) {
        console.error('Error parsing registration deadline:', error);
      }
    }
    
    // Check if registration deadline has passed
    if (registrationDeadline && today > registrationDeadline) {
      showModal('Registration Closed', 'For this event you are able to register for this event at event location on event date.');
      return;
    }
    
    // If registration is still open, proceed to registration page
    window.location.href = `/events/${event._id}/register`;
  };

  const isRegistrationClosed = (event: Event) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let registrationDeadline = null;
    
    // Parse registration deadline if it exists
    if (event.registrationDeadline) {
      try {
        // Parse YYYY-MM-DD format to Date object
        registrationDeadline = new Date(event.registrationDeadline);
      } catch (error) {
        console.error('Error parsing registration deadline:', error);
      }
    }
    
    return registrationDeadline && today > registrationDeadline;
  };

  // Helper function to categorize events
  const categorizeEvents = (events: Event[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const upcoming: Event[] = [];
    const ongoing: Event[] = [];
    const registrationClosed: Event[] = [];
    
    events.forEach(event => {
      try {
        // Parse event dates (YYYY-MM-DD format)
        const eventStartDate = new Date(event.eventStartDate);
        const eventEndDate = new Date(event.eventEndDate);
        
        // Skip events that have completely ended (event end date is before today)
        if (eventEndDate < today) {
          return; // Don't show events that have ended
        }
        
        // Parse registration deadline (YYYY-MM-DD format)
        let registrationDeadline = null;
        if (event.registrationDeadline) {
          try {
            registrationDeadline = new Date(event.registrationDeadline);
          } catch (error) {
            console.error('Error parsing registration deadline:', error);
          }
        }
        
        // Categorize based on registration deadline and event dates
        if (registrationDeadline && today > registrationDeadline) {
          // Registration deadline has passed but event hasn't ended yet
          registrationClosed.push(event);
        } else if (eventStartDate > today) {
          // Event hasn't started yet and registration is still open
          upcoming.push(event);
        } else if (eventEndDate >= today) {
          // Event is currently happening and registration is still open
          ongoing.push(event);
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
        const aDate = new Date(a.eventStartDate);
        const bDate = new Date(b.eventStartDate);
        return aDate.getTime() - bDate.getTime();
      } catch (error) {
        return 0;
      }
    };
    
    return { 
      upcoming: upcoming.sort(sortByDate), 
      ongoing: ongoing.sort(sortByDate), 
      registrationClosed: registrationClosed.sort(sortByDate)
    };
  };

  const { upcoming, ongoing, registrationClosed } = categorizeEvents(events);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Events - Visitrack</title>
        <meta name="description" content="Browse and register for upcoming events on Visitrack" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">


        {/* Events Section */}
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-[#4f46e5]"></div>
              <p className="mt-4 text-lg text-gray-600">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="text-red-600 text-lg mb-4">{error}</div>
              <Button onClick={fetchAllEvents} className="bg-[#4f46e5] hover:bg-[#4338ca]">
                Try Again
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Events Available</h3>
              <p className="text-gray-500 mb-8">Check back later for upcoming events.</p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#4f46e5] hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4f46e5]"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Upcoming Events */}
              {upcoming.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcoming.map((event) => (
                      <div
                        key={event._id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      >
                        {event.eventBanner && (
                          <div className="relative h-64">
                            <Image
                              src={event.eventBanner}
                              alt={event.eventName}
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
                              {event.eventStartDate} - {event.eventEndDate}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {event.eventName}
                          </h3>
                          <p className="text-gray-600 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.eventLocation}
                          </p>
                          <p className="text-gray-600 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {event.eventStartTime} - {event.eventEndTime}
                          </p>
                          <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                            {event.eventInformation}
                          </p>
                          {event.registrationDeadline && (
                            <p className="text-gray-500 text-sm mb-4">
                              <strong>Registration Deadline:</strong> {event.registrationDeadline}
                            </p>
                          )}
                          {event.status === 'cancel' ? (
                            <button
                              onClick={() => handleRegisterClick(event)}
                              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                            >
                              Event Cancelled
                            </button>
                          ) : isRegistrationClosed(event) ? (
                            <button
                              onClick={() => handleRegisterClick(event)}
                              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                            >
                              Registration Closed
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegisterClick(event)}
                              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4f46e5] hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4f46e5] cursor-pointer"
                            >
                              Registration
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ongoing Events */}
              {ongoing.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Ongoing Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ongoing.map((event) => (
                      <div
                        key={event._id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      >
                        {event.eventBanner && (
                          <div className="relative h-64">
                            <Image
                              src={event.eventBanner}
                              alt={event.eventName}
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
                              {event.eventStartDate} - {event.eventEndDate}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {event.eventName}
                          </h3>
                          <p className="text-gray-600 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.eventLocation}
                          </p>
                          <p className="text-gray-600 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {event.eventStartTime} - {event.eventEndTime}
                          </p>
                          <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                            {event.eventInformation}
                          </p>
                          {event.registrationDeadline && (
                            <p className="text-gray-500 text-sm mb-4">
                              <strong>Registration Deadline:</strong> {event.registrationDeadline}
                            </p>
                          )}
                          <button
                            onClick={() => handleRegisterClick(event)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#4f46e5] hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4f46e5] cursor-pointer"
                          >
                            Registration
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration Closed Events */}
              {registrationClosed.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Registration Closed</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {registrationClosed.map((event: Event) => (
                      <div
                        key={event._id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      >
                        {event.eventBanner && (
                          <div className="relative h-64">
                            <Image
                              src={event.eventBanner}
                              alt={event.eventName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Registration Closed
                            </span>
                            <span className="text-sm text-gray-500">
                              {event.eventStartDate} - {event.eventEndDate}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {event.eventName}
                          </h3>
                          <p className="text-gray-600 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.eventLocation}
                          </p>
                          <p className="text-gray-600 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {event.eventStartTime} - {event.eventEndTime}
                          </p>
                          <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                            {event.eventInformation}
                          </p>
                          {event.registrationDeadline && (
                            <p className="text-gray-500 text-sm mb-4">
                              <strong>Registration Deadline:</strong> {event.registrationDeadline}
                            </p>
                          )}
                          <button
                            onClick={() => handleRegisterClick(event)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
                          >
                            Registration Closed
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
      </main>


      {/* Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogContent}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventsPage;