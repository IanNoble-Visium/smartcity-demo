// vite.config.ts
import { defineConfig } from "file:///home/oai/share/smartcity-demo/node_modules/vite/dist/node/index.js";
import react from "file:///home/oai/share/smartcity-demo/node_modules/@vitejs/plugin-react/dist/index.js";
import { viteStaticCopy } from "file:///home/oai/share/smartcity-demo/node_modules/vite-plugin-static-copy/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/cesium/Build/Cesium/Workers",
          dest: "cesium"
        },
        {
          src: "node_modules/cesium/Build/Cesium/ThirdParty",
          dest: "cesium"
        },
        {
          src: "node_modules/cesium/Build/Cesium/Assets",
          dest: "cesium"
        },
        {
          src: "node_modules/cesium/Build/Cesium/Widgets",
          dest: "cesium"
        }
      ]
    })
  ],
  optimizeDeps: {
    include: [
      "@react-three/fiber",
      "@react-three/drei",
      "three",
      "three/examples/jsm/controls/OrbitControls",
      "three/examples/jsm/loaders/GLTFLoader",
      "three/examples/jsm/utils/BufferGeometryUtils"
    ],
    exclude: ["cesium", "mersenne-twister"],
    force: true,
    esbuildOptions: {
      target: "esnext"
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
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          "three": ["three"],
          "react-three": ["@react-three/fiber", "@react-three/drei"]
        }
      }
    }
  },
  resolve: {
    alias: {
      "three": "three"
    }
  },
  define: {
    // Define Cesium base URL for assets
    CESIUM_BASE_URL: JSON.stringify("/cesium/"),
    // Fix global issues
    global: "globalThis"
  },
  ssr: {
    noExternal: ["cesium"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9vYWkvc2hhcmUvc21hcnRjaXR5LWRlbW9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL29haS9zaGFyZS9zbWFydGNpdHktZGVtby92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9vYWkvc2hhcmUvc21hcnRjaXR5LWRlbW8vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tICd2aXRlLXBsdWdpbi1zdGF0aWMtY29weSdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogJ25vZGVfbW9kdWxlcy9jZXNpdW0vQnVpbGQvQ2VzaXVtL1dvcmtlcnMnLFxuICAgICAgICAgIGRlc3Q6ICdjZXNpdW0nXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzcmM6ICdub2RlX21vZHVsZXMvY2VzaXVtL0J1aWxkL0Nlc2l1bS9UaGlyZFBhcnR5JyxcbiAgICAgICAgICBkZXN0OiAnY2VzaXVtJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3JjOiAnbm9kZV9tb2R1bGVzL2Nlc2l1bS9CdWlsZC9DZXNpdW0vQXNzZXRzJyxcbiAgICAgICAgICBkZXN0OiAnY2VzaXVtJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3JjOiAnbm9kZV9tb2R1bGVzL2Nlc2l1bS9CdWlsZC9DZXNpdW0vV2lkZ2V0cycsXG4gICAgICAgICAgZGVzdDogJ2Nlc2l1bSdcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pXG4gIF0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdAcmVhY3QtdGhyZWUvZmliZXInLFxuICAgICAgJ0ByZWFjdC10aHJlZS9kcmVpJyxcbiAgICAgICd0aHJlZScsXG4gICAgICAndGhyZWUvZXhhbXBsZXMvanNtL2NvbnRyb2xzL09yYml0Q29udHJvbHMnLFxuICAgICAgJ3RocmVlL2V4YW1wbGVzL2pzbS9sb2FkZXJzL0dMVEZMb2FkZXInLFxuICAgICAgJ3RocmVlL2V4YW1wbGVzL2pzbS91dGlscy9CdWZmZXJHZW9tZXRyeVV0aWxzJ1xuICAgIF0sXG4gICAgZXhjbHVkZTogWydjZXNpdW0nLCAnbWVyc2VubmUtdHdpc3RlciddLFxuICAgIGZvcmNlOiB0cnVlLFxuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICB0YXJnZXQ6ICdlc25leHQnXG4gICAgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogZmFsc2VcbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3RocmVlJzogWyd0aHJlZSddLFxuICAgICAgICAgICdyZWFjdC10aHJlZSc6IFsnQHJlYWN0LXRocmVlL2ZpYmVyJywgJ0ByZWFjdC10aHJlZS9kcmVpJ11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAndGhyZWUnOiAndGhyZWUnXG4gICAgfVxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAvLyBEZWZpbmUgQ2VzaXVtIGJhc2UgVVJMIGZvciBhc3NldHNcbiAgICBDRVNJVU1fQkFTRV9VUkw6IEpTT04uc3RyaW5naWZ5KCcvY2VzaXVtLycpLFxuICAgIC8vIEZpeCBnbG9iYWwgaXNzdWVzXG4gICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcydcbiAgfSxcbiAgc3NyOiB7XG4gICAgbm9FeHRlcm5hbDogWydjZXNpdW0nXVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0USxTQUFTLG9CQUFvQjtBQUN6UyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxzQkFBc0I7QUFHL0IsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sZUFBZTtBQUFBLE1BQ2IsU0FBUztBQUFBLFFBQ1A7QUFBQSxVQUNFLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsVUFDRSxLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxVQUNFLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNSO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTLENBQUMsVUFBVSxrQkFBa0I7QUFBQSxJQUN0QyxPQUFPO0FBQUEsSUFDUCxnQkFBZ0I7QUFBQSxNQUNkLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixTQUFTLENBQUMsT0FBTztBQUFBLFVBQ2pCLGVBQWUsQ0FBQyxzQkFBc0IsbUJBQW1CO0FBQUEsUUFDM0Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTixpQkFBaUIsS0FBSyxVQUFVLFVBQVU7QUFBQTtBQUFBLElBRTFDLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxZQUFZLENBQUMsUUFBUTtBQUFBLEVBQ3ZCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
