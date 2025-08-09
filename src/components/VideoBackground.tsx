import React, { useRef, useEffect, useState, memo } from 'react';
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
  fallbackGradient?: string;
  enableAnimatedFallback?: boolean;
  children?: React.ReactNode;
}

const DISABLE_VIDEOS = true;

const VideoBackground = memo(function VideoBackground({
  videoSrc,
  className = '',
  overlay = true,
  overlayOpacity = 0.7,
  muted = true,
  loop = true,
  autoPlay = true,
  fallbackImage,
  fallbackGradient,
  enableAnimatedFallback = true,
  children
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastSrc, setLastSrc] = useState<string | null>(null);

  useEffect(() => {
    if (DISABLE_VIDEOS) {
      return; // Skip setting up video entirely
    }
    const video = videoRef.current;
    if (!video) return;

    // Guard against redundant setup when the same src is applied repeatedly
    if (lastSrc === videoSrc && isLoaded && !hasError) {
      return;
    }
    setLastSrc(videoSrc);

    console.log('VideoBackground: Setting up video element for:', videoSrc);

    const handleLoadedData = () => {
      console.log('Video loaded successfully:', videoSrc);
      setIsLoaded(true);
      setHasError(false);

      // Try to play the video
      video.play().then(() => {
        console.log('Video started playing successfully');
      }).catch((error) => {
        console.warn('Video autoplay failed:', error);
        // This is normal for browsers with strict autoplay policies
      });
    };

    const handleError = () => {
      console.error('Video failed to load:', videoSrc);
      setHasError(true);
      setIsLoaded(false);
    };

    const handleCanPlay = () => {
      // Video is ready to play
    };

    const handlePlay = () => {
      console.log('Video started playing:', videoSrc);
    };

    const handlePause = () => {
      console.log('Video paused:', videoSrc);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoSrc, lastSrc, isLoaded, hasError]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ pointerEvents: 'none' }}>
      {/* Video Element disabled */}
      {!DISABLE_VIDEOS && (
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
      )}

      {/* Fallback Content */}
      {(DISABLE_VIDEOS || hasError || !isLoaded) && (
        <div className="absolute inset-0 w-full h-full">
          {/* Fallback Image */}
          {fallbackImage && (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${fallbackImage})` }}
            />
          )}

          {/* Fallback Gradient */}
          {!fallbackImage && (fallbackGradient || DISABLE_VIDEOS) && (
            <div
              className="absolute inset-0 w-full h-full"
              style={{ background: fallbackGradient || 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
            />
          )}

          {/* Default Animated Fallback */}
          {!fallbackImage && !fallbackGradient && !DISABLE_VIDEOS && enableAnimatedFallback && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
              {/* Animated grid pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-green-900/30"></div>
                <div className="absolute inset-0 opacity-30">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={`h-${i}`}
                      className="absolute border-t border-blue-400/20 w-full"
                      style={{ top: `${i * 5}%` }}
                    />
                  ))}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={`v-${i}`}
                      className="absolute border-l border-green-400/20 h-full"
                      style={{ left: `${i * 5}%` }}
                    />
                  ))}
                </div>

                {/* Floating particles */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const leftPos = Math.random() * 100;
                  const topPos = Math.random() * 100;
                  const xMove = Math.random() * 100 - 50;
                  const yMove = Math.random() * 100 - 50;
                  const duration = 4 + Math.random() * 2;
                  const delay = Math.random() * 2;
                  
                  return (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute w-2 h-2 bg-blue-400/40 rounded-full"
                      initial={{
                        left: `${leftPos}%`,
                        top: `${topPos}%`,
                        opacity: 0
                      }}
                      animate={{
                        x: [0, xMove],
                        y: [0, yMove],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration,
                        repeat: Infinity,
                        delay,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
        <div className="relative z-10 h-full" style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      )}

      {/* Loading indicator */}
      {!DISABLE_VIDEOS && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <div className="flex items-center gap-2 text-muted">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading video...</span>
          </div>
        </div>
      )}
    </div>
  );
});

export { VideoBackground };

// Video mapping for different dashboard sections with fallback configurations
export const VIDEO_MAPPINGS = {
  // Dashboard backgrounds - using only existing videos
  executive: '/video/Futuristic_NOC_Video_Ready.mp4',
  analytics: '/video/Dynamic_City_Map_Video_Ready.mp4', // fallback to existing video
  map: '/video/Dynamic_City_Map_Video_Ready.mp4',
  energy: '/video/City_IoT_Connectivity_Flyover_Video.mp4', // fallback to existing video

  // Alert and incident videos - using existing videos as fallbacks
  cybersecurity: '/video/Scene_transition_smart_202508060022_nfeaf.mp4', // fallback to existing video
  emergency: '/video/Scene_transition_smart_202508060022_nfeaf.mp4', // fallback to existing video
  traffic: '/video/City_IoT_Connectivity_Flyover_Video.mp4', // fallback to existing video

  // Infrastructure monitoring - using existing videos
  network: '/video/City_IoT_Connectivity_Flyover_Video.mp4',
  infrastructure: '/video/Futuristic_NOC_Video_Ready.mp4', // fallback to existing video
  environmental: '/video/City_IoT_Connectivity_Flyover_Video.mp4', // fallback to existing video

  // Operations and management - using existing videos as fallbacks
  operations: '/video/Futuristic_NOC_Video_Ready.mp4', // fallback to existing video
  control_room: '/video/Futuristic_NOC_Video_Ready.mp4', // fallback to existing video
  citizen_services: '/video/Dynamic_City_Map_Video_Ready.mp4', // fallback to existing video

  // Specialized views - using existing videos
  transit: '/video/City_IoT_Connectivity_Flyover_Video.mp4', // fallback to existing video
  night_operations: '/video/Futuristic_NOC_Video_Ready.mp4', // fallback to existing video
  grid_monitoring: '/video/Futuristic_NOC_Video_Ready.mp4', // fallback to existing video
  dynamic_mapping: '/video/Dynamic_City_Map_Video_Ready.mp4',
  network_analysis: '/video/City_IoT_Connectivity_Flyover_Video.mp4', // fallback to existing video
  emergency_response: '/video/Scene_transition_smart_202508060022_nfeaf.mp4',
  citizen_experience: '/video/Dynamic_City_Map_Video_Ready.mp4' // fallback to existing video
} as const;

// Fallback gradients for different contexts
export const FALLBACK_GRADIENTS = {
  executive: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
  analytics: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
  map: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
  energy: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)',
  cybersecurity: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #ef4444 100%)',
  emergency: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
  traffic: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
  network: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
  infrastructure: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
  environmental: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
  operations: 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)',
  control_room: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)',
  citizen_services: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)',
  transit: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fb923c 100%)',
  night_operations: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
  grid_monitoring: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)',
  dynamic_mapping: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #0ea5e9 100%)',
  network_analysis: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #8b5cf6 100%)',
  emergency_response: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
  citizen_experience: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #67e8f9 100%)'
} as const;

export type VideoMappingKey = keyof typeof VIDEO_MAPPINGS;

// Hook for contextual video selection with stable references
export function useContextualVideo(context: VideoMappingKey, fallback?: VideoMappingKey) {
  const [currentVideo, setCurrentVideo] = useState<string>(() =>
    VIDEO_MAPPINGS[context] || (fallback ? VIDEO_MAPPINGS[fallback] : VIDEO_MAPPINGS.executive)
  );

  useEffect(() => {
    const video = VIDEO_MAPPINGS[context] || (fallback ? VIDEO_MAPPINGS[fallback] : VIDEO_MAPPINGS.executive);
    if (video !== currentVideo) {
      setCurrentVideo(video);
    }
  }, [context, fallback, currentVideo]);

  return currentVideo;
}

// Enhanced video background with context awareness
interface ContextualVideoBackgroundProps extends Omit<VideoBackgroundProps, 'videoSrc' | 'fallbackGradient'> {
  context: VideoMappingKey;
  fallback?: VideoMappingKey;
}

export const ContextualVideoBackground = memo(function ContextualVideoBackground({
  context,
  fallback = 'executive',
  ...props
}: ContextualVideoBackgroundProps) {
  const videoSrc = useContextualVideo(context, fallback);
  const fallbackGradient = FALLBACK_GRADIENTS[context] || FALLBACK_GRADIENTS.executive;

  return (
    <VideoBackground
      videoSrc={videoSrc}
      fallbackGradient={fallbackGradient}
      enableAnimatedFallback={true}
      {...props}
    />
  );
});