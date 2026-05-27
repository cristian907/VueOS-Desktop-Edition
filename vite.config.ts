import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// Configuración de Vite para el espacio de usuario (Vue 3)
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ['**/workspace/**']
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
