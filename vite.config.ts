import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // optional, if you want to fix the port
    strictPort: true, // optional, prevents Vite from switching ports
    allowedHosts: [
      'delivering-textiles-claire-determining.trycloudflare.com'
    ],
  },
})
