import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:7118',
        changeOrigin: true,
        secure: false, // Allows proxying to HTTPS localhost dev certificate
        ws: false,     // Do NOT proxy WebSocket upgrades — Binance WS connects directly
      }
    }
  }
});

