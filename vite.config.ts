import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Ensure all assets are bundled locally
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Keep Monaco Editor workers bundled
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          mermaid: ['mermaid'],
        },
      },
    },
  },
  // Optimize deps for offline bundling
  optimizeDeps: {
    include: ['monaco-editor', 'mermaid'],
  },
});
