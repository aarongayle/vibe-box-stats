import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const serverlessTarget = process.env.VITE_DEV_SERVERLESS_URL || 'http://localhost:3000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: serverlessTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
