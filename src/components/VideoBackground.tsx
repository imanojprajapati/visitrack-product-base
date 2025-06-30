'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const VideoBackground = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div className="relative w-full h-full">
        {!videoError ? (
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            style={{ zIndex: 0 }}
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          // Fallback image if video fails to load
          <Image
            src="/images/hero-banner.jpg"
            alt="Hero Background"
            fill
            className="object-cover"
            style={{ zIndex: 0 }}
            priority
          />
        )}
        
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent"
          style={{ zIndex: 1 }}
        />
        
        {/* Loading state */}
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center" style={{ zIndex: 2 }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoBackground; 