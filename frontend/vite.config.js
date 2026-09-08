import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const indexHtmlPath = path.join(distDir, 'index.html')
      if (!fs.existsSync(indexHtmlPath)) return

      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')

      // 1. Generate 404.html (standard fallback for cloud hosts like Vercel)
      fs.writeFileSync(path.join(distDir, '404.html'), indexHtml)

      // 2. Generate static html and directory index files for routes
      const routes = [
        'landing',
        'login',
        'register',
        'profile',
        'dashboard',
        'my-roster',
        'ward-roster',
        'swap',
        'transfer',
        'leave',
        'overtime',
        'notices',
        'news',
        'drugs',
        'equipment',
        'opportunities',
        'community',
        'documents',
        'notifications',
        'admin',
        'admin/users',
        'admin/verify',
        'admin/roster',
        'admin/leave',
        'admin/overtime',
        'admin/notices',
        'admin/news',
        'admin/drugs',
        'admin/equipment',
        'admin/opportunities',
        'admin/documents',
        'admin/community',
        'admin/wards',
        'admin/hospitals',
        'admin/swaps',
        'admin/transfers',
      ]

      for (const route of routes) {
        // e.g. dist/landing.html
        fs.writeFileSync(path.join(distDir, `${route.replace(/\//g, '_')}.html`), indexHtml)
        if (!route.includes('/')) {
          fs.writeFileSync(path.join(distDir, `${route}.html`), indexHtml)
        }

        // e.g. dist/landing/index.html
        const dir = path.join(distDir, route)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), indexHtml)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

