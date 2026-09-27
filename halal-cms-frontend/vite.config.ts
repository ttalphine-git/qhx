import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'
import path from 'path'

const isAppPlatform = Boolean(process.env.PORT)

const serviceUrl = (envKey: string, appPlatformUrl: string, localUrl: string) =>
  process.env[envKey] || (isAppPlatform ? appPlatformUrl : localUrl)

const authServiceUrl = serviceUrl('AUTH_SERVICE_URL', 'http://auth-service:8081', 'http://localhost:8081')
const applicationServiceUrl = serviceUrl('APPLICATION_SERVICE_URL', 'http://application-service:8082', 'http://localhost:8082')
const inspectionServiceUrl = serviceUrl('INSPECTION_SERVICE_URL', 'http://inspection-service:8083', 'http://localhost:8083')
const certificateServiceUrl = serviceUrl('CERTIFICATE_SERVICE_URL', 'http://certificate-service:8084', 'http://localhost:8084')
const companyServiceUrl = serviceUrl('COMPANY_SERVICE_URL', 'http://company-service:8085', 'http://localhost:8085')
const apiGatewayUrl = serviceUrl('API_GATEWAY_URL', 'http://api-gateway:8080', 'http://localhost:8080')

const proxy: Record<string, string | ProxyOptions> = {
  '/api/auth': {
    target: authServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/companies': {
    target: companyServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/applications': {
    target: applicationServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
    configure: (proxy) => {
      proxy.on('error', (err: any) => {
        if (err.code === 'ECONNREFUSED') {
          console.log(`Application service is not reachable at ${applicationServiceUrl}`)
        }
      })
    },
  },
  '/api/dashboard': {
    target: applicationServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/system': {
    target: applicationServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/audits': {
    target: inspectionServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/audit-plans': {
    target: inspectionServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/nc': {
    target: inspectionServiceUrl,
    changeOrigin: true,
  },
  '/api/audit-summary': {
    target: inspectionServiceUrl,
    changeOrigin: true,
  },
  '/api/decisions': {
    target: inspectionServiceUrl,
    changeOrigin: true,
  },
  '/api/certificates/generate': {
    target: inspectionServiceUrl,
    changeOrigin: true,
  },
  '^/api/certificates/[^/]+/(approve|send)$': {
    target: inspectionServiceUrl,
    changeOrigin: true,
  },
  '/api/batch-certificates': {
    target: certificateServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/certificates': {
    target: certificateServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/mgmt': {
    target: authServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api/users': {
    target: authServiceUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
  '/api': {
    target: apiGatewayUrl,
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  preview: {
    allowedHosts: ['clownfish-app-yywms.ondigitalocean.app'],
    proxy,
  },
  server: {
    port: 5173,
    proxy,
  },
})
