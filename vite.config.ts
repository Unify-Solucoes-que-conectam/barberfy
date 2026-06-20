import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { readFileSync } from 'fs'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt'],
      manifest: {
        name: 'BarberFy',
        short_name: 'BarberFy',
        description: 'Agende seu horário na barbearia',
        start_url: '/client/home',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#d8d8d8',
        id: '/barberapp',
        scope: '/',
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
        screenshots: [
          {
            src: '/screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'BarberApp - Painel',
          },
          {
            src: '/screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            label: 'BarberApp - Mobile',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ui-avatars\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
    {
      name: 'redirect-to-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Se o usuário acessar a raiz ou esquecer a barra final em /barberfy
          if (req.url === '/' || req.url === '/barberfy') {
            res.writeHead(301, { Location: '/barberfy/' })
            res.end()
          } else if (req.url && !req.url.startsWith('/barberfy/')) {
            // Se ele digitar algo como /b, manda para /barberfy/b ou direto para a base
            res.writeHead(301, { Location: '/barberfy/' })
            res.end()
          } else {
            next()
          }
        })
      },
    },
  ],
  define: {
    'process.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: false, // Permite mudar de porta se 3000 estiver em uso,
    allowedHosts: ['apps.unifysolucoes.com.br'],
  },
  build: {
    chunkSizeWarningLimit: 10000,
    outDir: 'dist', // Tudo em uma pasta única
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  // Configuração para o modo de Preview/Produção
  preview: {
    allowedHosts: ['apps.unifysolucoes.com.br'],
  },
  base: '/barberfy/',
})
