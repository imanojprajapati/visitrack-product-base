import React from 'react';
import Image from 'next/image';
import { Badge } from '@/types/badge';
import { Event } from '@/types/event';

interface RegistrationLayoutProps {
  children: React.ReactNode;
  badge?: Badge | null;
  event?: Event | null;
}

const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({ children, badge, event }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Custom Badge Header */}
      {badge && event && (
        <header className="relative w-full">
          {/* Badge Banner with Responsive Heights */}
          <div className="relative w-full h-[120px] md:h-[240px] lg:h-[320px] overflow-hidden">
            <Image
              src={badge.badgeImage}
              alt={badge.badgeName}
              fill
              className="object-cover"
              priority
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40" />
            
            {/* Event Information Overlay */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-3 sm:p-4 lg:p-6">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 leading-tight">
                  {event.eventName}
                </h1>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm md:text-base lg:text-lg">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate max-w-[200px] sm:max-w-none">{event.eventLocation}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{event.eventStartDate} - {event.eventEndDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      {/* Custom Badge Footer */}
      {badge && event && (
        <footer className="bg-gray-900 text-white py-4 sm:py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
              {/* Badge Information */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0">
                  <Image
                    src={badge.badgeImage}
                    alt={badge.badgeName}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-base sm:text-lg md:text-xl">
                    {event.eventName}
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base">
                    Event Registration
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="text-center lg:text-right">
                <div className="flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                  <div className="flex items-center gap-1 sm:gap-2 justify-center lg:justify-end">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-300 truncate">{event.eventLocation}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 justify-center lg:justify-end">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-300 truncate">
                      {event.eventStartDate} - {event.eventEndDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 justify-center lg:justify-end">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-300 truncate">
                      {event.eventStartTime} - {event.eventEndTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-xs sm:text-sm">
                © {new Date().getFullYear()} Visitrack. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default RegistrationLayout; 