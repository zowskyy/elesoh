import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const webPort = Number.parseInt(process.env['WEB_PORT'] ?? '3000', 10);

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number.isNaN(webPort) ? 3000 : webPort,
  },
});
