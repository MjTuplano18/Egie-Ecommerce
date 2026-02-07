import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    headers: {
      // CSP with blob: support for THREE.js 3D model loading
      'Content-Security-Policy': "default-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mhhnfftaoihhltbknenq.supabase.co https://api.groq.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co https://i.ibb.co blob:; font-src 'self' data:; connect-src 'self' blob: http://localhost:* https://mhhnfftaoihhltbknenq.supabase.co https://api.groq.com https://api.sketchfab.com https://sketchfab-prod-media.s3.amazonaws.com wss://mhhnfftaoihhltbknenq.supabase.co; frame-ancestors 'none';"
    }
  }
})
