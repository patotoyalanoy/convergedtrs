import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

process.env.BROWSER = 'msedge';

export default defineConfig({
  server: {
    open: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['CSiLogo.png', 'app-icon.png', 'favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,jpg,jpeg,gif}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: 'Converge-DTRS',
        short_name: 'DTRS',
        description: 'Attendance Monitoring System for Converge',
        theme_color: '#0B192C',
        background_color: '#0B192C',
        display: 'standalone',
        icons: [
          {
            src: '/app-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/app-icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
