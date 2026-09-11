import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5193,
    strictPort: true,
  },
  preview: {
    port: 5193,
    strictPort: true,
  },
});
