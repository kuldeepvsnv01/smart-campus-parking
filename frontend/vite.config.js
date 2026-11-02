import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('html5-qrcode') || id.includes('qrcode.react')) {
              return 'qr';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
