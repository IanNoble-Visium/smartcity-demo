import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'three/examples/jsm/controls/OrbitControls',
      'three/examples/jsm/loaders/GLTFLoader',
      'three/examples/jsm/utils/BufferGeometryUtils',
      'cesium'
    ],
    exclude: [],
    force: false,
    esbuildOptions: {
      target: 'esnext'
    }
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          'cesium': ['cesium']
        }
      }
    }
  },
  resolve: {
    alias: {
      'three': 'three'
    }
  },
  define: {
    // Define Cesium base URL for assets
    CESIUM_BASE_URL: JSON.stringify('/cesium/')
  }
})
