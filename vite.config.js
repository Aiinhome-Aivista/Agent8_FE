import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3033,
    proxy: {
      '/api': {
        target: 'http://187.127.163.17:3033',
        changeOrigin: true,
      },
    },
  },
})
