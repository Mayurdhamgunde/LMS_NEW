import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),react()],
  server: {
    // Proxy configuration removed - using direct API calls
    allowedHosts: ['4f6f-152-59-7-120.ngrok-free.app'],
  },
}) 