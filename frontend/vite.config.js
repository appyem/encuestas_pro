// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Esto permite que /admin funcione en desarrollo
    middlewareMode: false,
  },
  // 👇 Añadir esta línea:
  build: {
    outDir: 'dist',
  },
});