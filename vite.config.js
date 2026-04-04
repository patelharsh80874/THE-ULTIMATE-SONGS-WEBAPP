/**
 * THE ULTIMATE SONGS - Elite Music Streaming Experience
 * Developed by: Harsh Patel
 * GitHub: @patelharsh80874
 * Portfolio: patelharsh.in
 * Version: 2.0.0
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from 'vite-plugin-wasm';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    wasm(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.webp'],
      manifest: {
        name: 'THE ULTIMATE SONGS',
        short_name: 'Ultimate Songs',
        description: 'Elite Music Streaming Experience - Curated & Crafted by Harsh Patel. Discover the ultimate collection of tracks, albums, and community-driven playlists.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['music', 'entertainment', 'player', 'social'],
        icons: [
          {
            src: 'icons/The-Ultimate-Songs-192x192.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: 'icons/The-Ultimate-Songs-512x512.webp',
            sizes: '512x512',
            type: 'image/webp'
          },
          {
            src: 'icons/The-Ultimate-Songs-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 100000000, // 100MB limit for large WASM and media files
      }
    })
  ],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});
