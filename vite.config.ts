// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',         // ← prompt mode
      includeAssets: ['favicon.ico','icon-192.png','icon-512.png'],
      manifest: {
        name: 'BeFriends',
        short_name: 'BeFriends',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src:'/icon-192.png', sizes:'192x192', type:'image/png' },
          { src:'/icon-512.png', sizes:'512x512', type:'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            // allow Appwrite images to be fetched network-first
            urlPattern: /^https:\/\/cloud\.appwrite\.io\/v1\/storage\/buckets\/.*\/files\/.*\/download/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'appwrite-images',
              expiration: { maxEntries: 50, maxAgeSeconds: 60*60*24 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
