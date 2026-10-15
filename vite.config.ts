import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'tafakem.ai.studio',
      '.ai.studio',
      '.run.app',
      'localhost',
      '127.0.0.1',
    ],
  },
});
