import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Get SSL certificates
const certsDir = path.join(__dirname, '..', 'backend', 'certs');
const sslConfig = {
  key: fs.readFileSync(path.join(certsDir, 'key.pem')),
  cert: fs.readFileSync(path.join(certsDir, 'cert.pem')),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: sslConfig,
    proxy: {
      '/api': {
        target: 'https://localhost:3443',
        secure: false, // Accept self-signed certificates
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}); 