import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      '/backend': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
