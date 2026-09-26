import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // auth-service (port 8081 via Docker) – strip /api prefix before forwarding
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // company-service (port 8083 via Docker) – strip /api prefix before forwarding
      '/api/companies': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // application-service (port 8082) – /api/applications, /api/dashboard
      '/api/applications': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err: any, _req, _res) => {
            if (err.code === 'ECONNREFUSED') {
              console.log('Backend service not running on port 8082 - install Maven and run: mvn clean package')
            }
          })
        },
      },
      '/api/dashboard': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/system': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // inspection-service (port 8084) – /api/audits, /api/audit-plans
      '/api/audits': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/audit-plans': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // certificate-service (port 8085) – /api/certificates
      '/api/nc': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/audit-summary': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/decisions': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/certificates/generate': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '^/api/certificates/[^/]+/(approve|send)$': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/batch-certificates': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/certificates': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // auth-service: mgmt and users endpoints
      '/api/mgmt': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/users': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // fallback: api-gateway (port 8080) for all other /api/** calls
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
