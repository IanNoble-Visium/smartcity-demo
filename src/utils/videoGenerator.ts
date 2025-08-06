/**
 * Video Generator Utility
 * Creates placeholder videos programmatically for the smart city dashboard
 */

export interface VideoConfig {
  width: number;
  height: number;
  duration: number; // in seconds
  fps: number;
  backgroundColor: string;
  elements: VideoElement[];
}

export interface VideoElement {
  type: 'circle' | 'rectangle' | 'line' | 'text' | 'grid' | 'particle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  opacity?: number;
  animation?: {
    type: 'move' | 'scale' | 'fade' | 'rotate';
    duration: number;
    from: any;
    to: any;
    easing?: string;
  };
  text?: string;
  fontSize?: number;
}

// Predefined video configurations for different contexts
export const VIDEO_CONFIGS: Record<string, VideoConfig> = {
  executive: {
    width: 1920,
    height: 1080,
    duration: 10,
    fps: 30,
    backgroundColor: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
    elements: [
      {
        type: 'grid',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        color: '#3b82f6',
        opacity: 0.1,
        animation: {
          type: 'fade',
          duration: 3,
          from: { opacity: 0 },
          to: { opacity: 0.3 }
        }
      },
      {
        type: 'text',
        x: 960,
        y: 540,
        text: 'TruContext Executive Dashboard',
        fontSize: 48,
        color: '#ffffff',
        opacity: 0.8
      }
    ]
  },
  
  dynamic_mapping: {
    width: 1920,
    height: 1080,
    duration: 15,
    fps: 30,
    backgroundColor: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #0ea5e9 100%)',
    elements: [
      {
        type: 'grid',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        color: '#60a5fa',
        opacity: 0.2
      },
      {
        type: 'text',
        x: 960,
        y: 540,
        text: 'Dynamic City Mapping',
        fontSize: 42,
        color: '#ffffff',
        opacity: 0.9
      }
    ]
  },
  
  network: {
    width: 1920,
    height: 1080,
    duration: 12,
    fps: 30,
    backgroundColor: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
    elements: [
      {
        type: 'grid',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        color: '#93c5fd',
        opacity: 0.15
      },
      {
        type: 'text',
        x: 960,
        y: 540,
        text: 'IoT Network Connectivity',
        fontSize: 40,
        color: '#ffffff',
        opacity: 0.85
      }
    ]
  },
  
  emergency_response: {
    width: 1920,
    height: 1080,
    duration: 8,
    fps: 30,
    backgroundColor: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
    elements: [
      {
        type: 'grid',
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        color: '#fca5a5',
        opacity: 0.2
      },
      {
        type: 'text',
        x: 960,
        y: 540,
        text: 'Emergency Response System',
        fontSize: 38,
        color: '#ffffff',
        opacity: 0.9
      }
    ]
  }
};

/**
 * Generate a canvas-based video frame
 */
export function generateVideoFrame(
  canvas: HTMLCanvasElement,
  config: VideoConfig,
  frameNumber: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = config.width;
  canvas.height = config.height;

  // Clear canvas
  ctx.clearRect(0, 0, config.width, config.height);

  // Apply background
  if (config.backgroundColor.startsWith('linear-gradient')) {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, config.width, config.height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(0.5, '#334155');
    gradient.addColorStop(1, '#475569');
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = config.backgroundColor;
  }
  ctx.fillRect(0, 0, config.width, config.height);

  // Render elements
  config.elements.forEach(element => {
    ctx.save();
    
    // Apply opacity
    if (element.opacity !== undefined) {
      ctx.globalAlpha = element.opacity;
    }

    // Apply animations
    let animatedProps = { ...element };
    if (element.animation) {
      const progress = (frameNumber / (config.fps * element.animation.duration)) % 1;
      // Simple linear interpolation for now
      if (element.animation.type === 'fade') {
        const fromOpacity = element.animation.from.opacity || 0;
        const toOpacity = element.animation.to.opacity || 1;
        animatedProps.opacity = fromOpacity + (toOpacity - fromOpacity) * progress;
        ctx.globalAlpha = animatedProps.opacity || 1;
      }
    }

    // Render based on type
    switch (element.type) {
      case 'grid':
        renderGrid(ctx, animatedProps);
        break;
      case 'text':
        renderText(ctx, animatedProps);
        break;
      case 'circle':
        renderCircle(ctx, animatedProps);
        break;
      case 'rectangle':
        renderRectangle(ctx, animatedProps);
        break;
      case 'particle':
        renderParticle(ctx, animatedProps, frameNumber);
        break;
    }

    ctx.restore();
  });
}

function renderGrid(ctx: CanvasRenderingContext2D, element: VideoElement): void {
  if (!element.width || !element.height) return;
  
  ctx.strokeStyle = element.color;
  ctx.lineWidth = 1;
  
  const gridSize = 50;
  
  // Vertical lines
  for (let x = 0; x <= element.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, element.height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y <= element.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(element.width, y);
    ctx.stroke();
  }
}

function renderText(ctx: CanvasRenderingContext2D, element: VideoElement): void {
  if (!element.text) return;
  
  ctx.fillStyle = element.color;
  ctx.font = `${element.fontSize || 24}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText(element.text, element.x, element.y);
}

function renderCircle(ctx: CanvasRenderingContext2D, element: VideoElement): void {
  if (!element.radius) return;
  
  ctx.fillStyle = element.color;
  ctx.beginPath();
  ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
  ctx.fill();
}

function renderRectangle(ctx: CanvasRenderingContext2D, element: VideoElement): void {
  if (!element.width || !element.height) return;
  
  ctx.fillStyle = element.color;
  ctx.fillRect(element.x, element.y, element.width, element.height);
}

function renderParticle(ctx: CanvasRenderingContext2D, element: VideoElement, frameNumber: number): void {
  const time = frameNumber * 0.1;
  const x = element.x + Math.sin(time) * 20;
  const y = element.y + Math.cos(time) * 20;
  
  ctx.fillStyle = element.color;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, 2 * Math.PI);
  ctx.fill();
}

/**
 * Create a blob URL for a generated video
 */
export async function createVideoBlob(config: VideoConfig): Promise<string> {
  // For now, return a data URL with a simple canvas image
  // In a real implementation, this would generate actual video frames
  const canvas = document.createElement('canvas');
  generateVideoFrame(canvas, config, 0);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        resolve('');
      }
    }, 'image/png');
  });
}
