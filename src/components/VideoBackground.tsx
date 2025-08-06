import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VideoBackgroundProps {
  videoSrc: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  fallbackImage?: string;
  children?: React.ReactNode;
}

export function VideoBackground({
  videoSrc,
  className = '',
  overlay = true,
  overlayOpacity = 0.7,
  muted = true,
  loop = true,
  autoPlay = true,
  fallbackImage,
  children
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoaded(true);
      setHasError(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoaded(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Video Element */}
      <motion.video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ 
          opacity: isLoaded && !hasError ? 1 : 0,
          scale: isLoaded && !hasError ? 1 : 1.1
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Fallback Image */}
      {(hasError || !isLoaded) && fallbackImage && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-500"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      {children && (
        <div className="relative z-10 h-full">
          {children}
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <div className="flex items-center gap-2 text-muted">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading video...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Video mapping for different dashboard sections
export const VIDEO_MAPPINGS = {
  // Dashboard backgrounds
  executive: '/video/Futuristic_NOC_Video_Ready.mp4',
  analytics: '/video/Animated_dashboard_walkthrough_202508060020_.mp4',
  map: '/video/Smart_City_Sunrise_Video_Generation.mp4',
  energy: '/video/Overhead_animation_of_202508060022_488qw.mp4',
  
  // Alert and incident videos
  cybersecurity: '/video/Cyberattack_Visualization_and_Response.mp4',
  emergency: '/video/Emergency_Response_Drone_and_Ambulance_Dispatch.mp4',
  traffic: '/video/Smart_Traffic_Flow_Optimization_Timelapse.mp4',
  
  // Infrastructure monitoring
  network: '/video/City_IoT_Connectivity_Flyover_Video.mp4',
  infrastructure: '/video/3d_visualization_of_202508060022_v98bv.mp4',
  environmental: '/video/Closeups_of_air_202508060021_eydg8.mp4',
  
  // Operations and management
  operations: '/video/Splitscreen_city_operations_202508060021_o7.mp4',
  control_room: '/video/Touchscreen_wall_in_202508060023_mcpqe.mp4',
  citizen_services: '/video/Diverse_citizens_interacting_202508060021_66y.mp4',
  
  // Specialized views
  transit: '/video/Smart_public_transit_202508060021_cdetx.mp4',
  night_operations: '/video/Nighttime_cityscape_with_202508060021_arch5.mp4',
  grid_monitoring: '/video/Real_Time_Grid_Strain_Dashboard.mp4',
  dynamic_mapping: '/video/Dynamic_City_Map_Video_Ready.mp4',
  network_analysis: '/video/Graph_network_view_202508060022_1uief.mp4',
  emergency_response: '/video/Scene_transition_smart_202508060022_nfeaf.mp4',
  citizen_experience: '/video/Virtual_citizen_experience_202508060022_odh0.mp4'
} as const;

export type VideoMappingKey = keyof typeof VIDEO_MAPPINGS;

// Hook for contextual video selection
export function useContextualVideo(context: VideoMappingKey, fallback?: VideoMappingKey) {
  const [currentVideo, setCurrentVideo] = useState<string>(VIDEO_MAPPINGS[context]);
  
  useEffect(() => {
    const video = VIDEO_MAPPINGS[context] || (fallback ? VIDEO_MAPPINGS[fallback] : VIDEO_MAPPINGS.executive);
    setCurrentVideo(video);
  }, [context, fallback]);

  return currentVideo;
}

// Enhanced video background with context awareness
interface ContextualVideoBackgroundProps extends Omit<VideoBackgroundProps, 'videoSrc'> {
  context: VideoMappingKey;
  fallback?: VideoMappingKey;
}

export function ContextualVideoBackground({
  context,
  fallback = 'executive',
  ...props
}: ContextualVideoBackgroundProps) {
  const videoSrc = useContextualVideo(context, fallback);
  
  return <VideoBackground videoSrc={videoSrc} {...props} />;
}