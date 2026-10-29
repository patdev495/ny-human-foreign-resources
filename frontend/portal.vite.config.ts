import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'portal-dist',
    emptyOutDir: true,
    rollupOptions: { input: resolve(import.meta.dirname, 'portal.html') },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: { '/api': { target: 'http://127.0.0.1:8006', changeOrigin: true } },
  },
})
