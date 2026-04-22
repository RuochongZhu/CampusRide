import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/frontend/**/*.test.js']
  },
  server: {
    port: 5173,
    host: process.env.VITE_HOST || '127.0.0.1'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (
            id.includes('@ant-design/icons-vue') ||
            id.includes('icons-vue')
          ) {
            return 'ui-icons';
          }

          if (
            id.includes('ant-design-vue') ||
            id.includes('@ant-design') ||
            id.includes('@ctrl/tinycolor')
          ) {
            return 'ui-kit';
          }

          if (
            id.includes('@googlemaps') ||
            id.includes('html5-qrcode') ||
            id.includes('qrcode.vue')
          ) {
            return 'maps-checkin';
          }

          if (
            id.includes('axios') ||
            id.includes('dayjs') ||
            id.includes('socket.io-client') ||
            id.includes('swiper')
          ) {
            return 'app-vendor';
          }

          if (
            id.includes('/node_modules/vue/') ||
            id.includes('/node_modules/@vue/') ||
            id.includes('pinia') ||
            id.includes('vue-router')
          ) {
            return 'vue-core';
          }

          return 'vendor';
        }
      }
    }
  }
})
