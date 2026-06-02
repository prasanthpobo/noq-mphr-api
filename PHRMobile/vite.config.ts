import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Expose both VITE_* (default) and OTP_* env vars to the client bundle.
  // Lets us write `OTP_ENABLE=true` in .env without the VITE_ prefix.
  envPrefix: ['VITE_', 'OTP_'],
})
