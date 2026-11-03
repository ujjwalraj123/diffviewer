import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'og-image.svg',
        'robots.txt',
        'sitemap.xml',
      ],
      manifest: {
        id: '/',
        name: 'DiffViewer',
        short_name: 'DiffViewer',
        description: 'Compare text and code in your browser.',
        theme_color: '#126BCF',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        categories: ['developer', 'utilities'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Diff Checker',
            short_name: 'Diff',
            url: '/',
            description: 'Compare two texts or code snippets',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'JSON Formatter',
            short_name: 'JSON',
            url: '/json-formatter',
            description: 'Format, validate and beautify JSON',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        // Precache the prerendered HTML pages so every route works offline
        globPatterns: [
          '**/*.{js,css,html,woff2,svg,png,webmanifest}',
        ],
        // Don't intercept SEO-critical static files with the SPA fallback;
        // let them be served directly from precache or network
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/robots\.txt$/,
          /^\/sitemap\.xml$/,
          /^\/BingSiteAuth\.xml$/,
          /^\/google[a-z0-9]+\.html$/,
          /^\/manifest\.webmanifest$/,
        ],
        cleanupOutdatedCaches: true,
        // Runtime caching for anything not precached (e.g. Google Analytics,
        // external fonts if any are added later)
        runtimeCaching: [
          {
            // Google Analytics / GTM — fire and forget; cache nothing
            urlPattern: /^https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com)\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Any same-origin images not caught by precache
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|avif|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Same-origin font files not caught by precache
            urlPattern: /\.(?:woff2?|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 4319 },
})