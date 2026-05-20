import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Standalone build of the OwlScout dashboard for hosting (Vercel).
// The extension itself is built by WXT — see wxt.config.ts.
export default defineConfig({
  root: 'demo',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, '.') },
  },
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
});
