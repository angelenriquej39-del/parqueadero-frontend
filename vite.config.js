import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separa las librerias grandes en archivos propios para que se
        // cacheen aparte y el bundle inicial pese menos.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('socket.io') || id.includes('engine.io')) return 'socket'
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'graficas'
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
