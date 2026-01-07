import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    fs: {
      allow: ['..'],
      deny: ['src/pages/challans', 'src/pages/quotations'],
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['src/pages/challans', 'src/pages/quotations'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI library chunks
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
          ],

          // Heavy dependencies
          'charts': ['recharts'],
          'pdf': ['jspdf', 'html2canvas', 'qrcode'],

          // Supabase and state management
          'supabase': ['@supabase/supabase-js'],
          'state': ['zustand', '@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
