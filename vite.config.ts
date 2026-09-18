import path from 'node:path'
import { execSync } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function proxyTarget(): string {
  if (process.env.VITE_PROXY_TARGET) return process.env.VITE_PROXY_TARGET
  // Dentro de WSL, el backend (proceso de Windows) se alcanza vía la IP del host.
  if (process.env.WSL_DISTRO_NAME) {
    try {
      const gw = execSync('ip route show default', { encoding: 'utf8' })
        .match(/default via (\S+)/)?.[1]
      if (gw) return `http://${gw}:8080`
    } catch {
      // fallback a localhost
    }
  }
  return 'http://localhost:8080'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: proxyTarget(),
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})