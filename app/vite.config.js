import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/sprites': 'http://localhost:8000',
      '/unitJson': 'http://localhost:8000',
    },
  },
});
