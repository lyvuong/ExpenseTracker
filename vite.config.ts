import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json' with { type: 'json' }
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const getBuildHash = () => {
  // Cloudflare Pages commit SHA
  if (process.env.CF_PAGES_COMMIT_SHA) {
    return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)
  }
  // GitHub Actions commit SHA
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 7)
  }
  // Local Git commit hash
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return ''
  }
}

const buildHash = getBuildHash()
const buildDate = new Date().toISOString().split('T')[0]

// Writes dist/version.json so the running app can fetch it (cache-busted, bypassing
// the service worker's asset cache) to detect when a newer build has been deployed.
const versionManifestPlugin = (): Plugin => ({
  name: 'write-version-manifest',
  apply: 'build',
  closeBundle() {
    const outDir = resolve(import.meta.dirname, 'dist')
    writeFileSync(
      resolve(outDir, 'version.json'),
      JSON.stringify({ version: packageJson.version, buildHash, buildDate })
    )
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionManifestPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_HASH__: JSON.stringify(buildHash)
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
        }
      }
    }
  }
})
