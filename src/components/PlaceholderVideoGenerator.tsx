import { useEffect, useState } from 'react';
import { VIDEO_CONFIGS, generateVideoFrame, type VideoConfig } from '../utils/videoGenerator';

interface PlaceholderVideoGeneratorProps {
  context: string;
  onVideoGenerated: (videoUrl: string) => void;
}

export function PlaceholderVideoGenerator({ context, onVideoGenerated }: PlaceholderVideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    generatePlaceholderVideo();
  }, [context]);

  const generatePlaceholderVideo = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const config = VIDEO_CONFIGS[context] || VIDEO_CONFIGS.executive;
      const videoUrl = await createAnimatedVideoDataUrl(config);
      onVideoGenerated(videoUrl);
    } catch (error) {
      console.error('Failed to generate placeholder video:', error);
      // Fallback to a static image
      const staticUrl = await createStaticImageDataUrl(context);
      onVideoGenerated(staticUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  const createAnimatedVideoDataUrl = async (config: VideoConfig): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = config.width;
    canvas.height = config.height;

    // Create a simple animated canvas that cycles through frames
    const frames: string[] = [];
    const totalFrames = Math.min(config.fps * config.duration, 60); // Limit to 60 frames for performance

    for (let frame = 0; frame < totalFrames; frame++) {
      generateVideoFrame(canvas, config, frame);
      frames.push(canvas.toDataURL('image/png'));
      setProgress((frame / totalFrames) * 100);
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // For now, return the first frame as a static image
    // In a real implementation, you would create an actual video file
    return frames[0];
  };

  const createStaticImageDataUrl = async (context: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 1920;
    canvas.height = 1080;

    // Create gradient background based on context
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    switch (context) {
      case 'executive':
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(0.5, '#334155');
        gradient.addColorStop(1, '#475569');
        break;
      case 'dynamic_mapping':
        gradient.addColorStop(0, '#0c4a6e');
        gradient.addColorStop(0.5, '#0284c7');
        gradient.addColorStop(1, '#0ea5e9');
        break;
      case 'network':
        gradient.addColorStop(0, '#1e40af');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#60a5fa');
        break;
      case 'emergency_response':
        gradient.addColorStop(0, '#dc2626');
        gradient.addColorStop(0.5, '#ef4444');
        gradient.addColorStop(1, '#f87171');
        break;
      default:
        gradient.addColorStop(0, '#374151');
        gradient.addColorStop(0.5, '#4b5563');
        gradient.addColorStop(1, '#6b7280');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Add context-specific text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const contextTitles: Record<string, string> = {
      executive: 'TruContext Executive Dashboard',
      dynamic_mapping: 'Dynamic City Mapping',
      network: 'IoT Network Connectivity',
      emergency_response: 'Emergency Response System',
      analytics: 'Advanced Analytics',
      cybersecurity: 'Cybersecurity Monitoring',
      traffic: 'Traffic Management',
      infrastructure: 'Infrastructure Monitoring',
      environmental: 'Environmental Systems'
    };

    const title = contextTitles[context] || 'Smart City Operations';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2);

    // Add subtitle
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Powered by TruContext Platform', canvas.width / 2, canvas.height / 2 + 60);

    return canvas.toDataURL('image/png');
  };

  if (!isGenerating) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-secondary rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Generating Video Assets</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Context: {context}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-accent rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            Creating placeholder video for enhanced visual experience...
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook to manage video generation
export function useVideoGeneration() {
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const generateVideoForContext = async (context: string): Promise<string> => {
    if (generatedVideos[context]) {
      return generatedVideos[context];
    }

    setIsGenerating(true);
    
    try {
      const config = VIDEO_CONFIGS[context] || VIDEO_CONFIGS.executive;
      const canvas = document.createElement('canvas');
      generateVideoFrame(canvas, config, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedVideos(prev => ({ ...prev, [context]: dataUrl }));
      return dataUrl;
    } catch (error) {
      console.error('Video generation failed:', error);
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatedVideos,
    isGenerating,
    generateVideoForContext
  };
}
