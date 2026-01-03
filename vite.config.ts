import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Important for Cloudflare Tunnel / external access
    allowedHosts: [
      'delivering-textiles-claire-determining.trycloudflare.com',
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      // This fixes all CORS issues with your backend
      '/api': {
        target: 'https://boocozmo-api.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})