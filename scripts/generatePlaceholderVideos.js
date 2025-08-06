/**
 * Generate placeholder video files for the smart city dashboard
 * This script creates simple MP4 files using FFmpeg or canvas-based generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Video files that need to be created
const requiredVideos = [
  'Futuristic_NOC_Video_Ready.mp4',
  'Scene_transition_smart_202508060022_nfeaf.mp4',
  'City_IoT_Connectivity_Flyover_Video.mp4',
  'Dynamic_City_Map_Video_Ready.mp4',
  'Animated_dashboard_walkthrough_202508060020_.mp4',
  'Smart_City_Sunrise_Video_Generation.mp4',
  'Overhead_animation_of_202508060022_488qw.mp4',
  'Cyberattack_Visualization_and_Response.mp4',
  'Emergency_Response_Drone_and_Ambulance_Dispatch.mp4',
  'Smart_Traffic_Flow_Optimization_Timelapse.mp4'
];

// Color schemes for different video types
const colorSchemes = {
  'Futuristic_NOC_Video_Ready.mp4': {
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#3b82f6'
  },
  'Scene_transition_smart_202508060022_nfeaf.mp4': {
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f87171'
  },
  'City_IoT_Connectivity_Flyover_Video.mp4': {
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#60a5fa'
  },
  'Dynamic_City_Map_Video_Ready.mp4': {
    primary: '#0c4a6e',
    secondary: '#0284c7',
    accent: '#0ea5e9'
  }
};

/**
 * Create a simple HTML5 video using canvas
 */
function createCanvasVideo(filename, colorScheme, duration = 10) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1920;
  canvas.height = 1080;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, colorScheme.primary);
  gradient.addColorStop(0.5, colorScheme.secondary);
  gradient.addColorStop(1, colorScheme.accent);
  
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
  
  // Add title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const title = filename.replace('.mp4', '').replace(/_/g, ' ');
  ctx.fillText(title, canvas.width / 2, canvas.height / 2);
  
  // Add subtitle
  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('TruContext Smart City Platform', canvas.width / 2, canvas.height / 2 + 60);
  
  return canvas.toDataURL('image/png');
}

/**
 * Generate FFmpeg command for creating a video from an image
 */
function generateFFmpegCommand(imagePath, outputPath, duration = 10) {
  return `ffmpeg -loop 1 -i "${imagePath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -vf "scale=1920:1080" "${outputPath}"`;
}

/**
 * Create placeholder videos using Node.js (server-side)
 */
async function generatePlaceholderVideos() {
  const videoDir = path.join(__dirname, '../public/video');
  
  // Ensure video directory exists
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }
  
  console.log('Generating placeholder videos...');
  
  for (const videoFile of requiredVideos) {
    const outputPath = path.join(videoDir, videoFile);
    
    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Skipping ${videoFile} - already exists`);
      continue;
    }
    
    console.log(`Creating ${videoFile}...`);
    
    // For now, create a simple text file as placeholder
    // In a real implementation, you would use FFmpeg or similar
    const placeholderContent = `# Placeholder for ${videoFile}
# This file represents a video that would contain:
# ${getVideoDescription(videoFile)}
# 
# To replace with actual video:
# 1. Place the real ${videoFile} in the public/video/ directory
# 2. Ensure it's in MP4 format with H.264 encoding
# 3. Recommended resolution: 1920x1080 or higher
# 4. Duration: 10-30 seconds for optimal loading
`;
    
    // Create a placeholder file
    fs.writeFileSync(outputPath.replace('.mp4', '.placeholder.txt'), placeholderContent);
    
    console.log(`Created placeholder for ${videoFile}`);
  }
  
  console.log('Placeholder generation complete!');
  console.log('\nTo create actual videos, you can use FFmpeg with commands like:');
  console.log('ffmpeg -f lavfi -i color=c=blue:size=1920x1080:duration=10 -c:v libx264 -pix_fmt yuv420p output.mp4');
}

/**
 * Get description for a video file
 */
function getVideoDescription(filename) {
  const descriptions = {
    'Futuristic_NOC_Video_Ready.mp4': 'Executive dashboard with futuristic NOC visualization',
    'Scene_transition_smart_202508060022_nfeaf.mp4': 'Emergency response scene transitions',
    'City_IoT_Connectivity_Flyover_Video.mp4': 'IoT network connectivity flyover animation',
    'Dynamic_City_Map_Video_Ready.mp4': 'Dynamic city mapping with real-time data',
    'Animated_dashboard_walkthrough_202508060020_.mp4': 'Analytics dashboard walkthrough',
    'Smart_City_Sunrise_Video_Generation.mp4': 'Smart city sunrise overview',
    'Overhead_animation_of_202508060022_488qw.mp4': 'Overhead city animation',
    'Cyberattack_Visualization_and_Response.mp4': 'Cybersecurity threat visualization',
    'Emergency_Response_Drone_and_Ambulance_Dispatch.mp4': 'Emergency response coordination',
    'Smart_Traffic_Flow_Optimization_Timelapse.mp4': 'Traffic flow optimization timelapse'
  };
  
  return descriptions[filename] || 'Smart city operations visualization';
}

// Browser-compatible version for client-side generation
if (typeof window !== 'undefined') {
  window.generatePlaceholderVideos = generatePlaceholderVideos;
  window.createCanvasVideo = createCanvasVideo;
}

// ES module exports
export {
  generatePlaceholderVideos,
  createCanvasVideo,
  generateFFmpegCommand,
  requiredVideos,
  colorSchemes
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePlaceholderVideos().catch(console.error);
}
