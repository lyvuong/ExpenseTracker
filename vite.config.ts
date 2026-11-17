import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json' with { type: 'json' }
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// --- Standard build info (identical in every project) -----------------------------------------
// package.json "version" is only the base "<major>.<minor>" (bump it by hand for a deliberate
// release). The shipped version is "<major>.<minor>.<commit count>", derived from git at build
// time, so there is no per-commit bump hook and no version conflicts between clones or branches.
const git = (args: string): string => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};

const getBuildInfo = (baseVersion: string) => {
  const [major = '0', minor = '0'] = baseVersion.split('.');
  // CI clones are often shallow, which would undercount commits — deepen first if we can.
  if (git('rev-parse --is-shallow-repository') === 'true') git('fetch --unshallow --quiet');
  const count = git('rev-parse --is-shallow-repository') === 'true' ? '' : git('rev-list --count HEAD');
  const sha = process.env.CF_PAGES_COMMIT_SHA || process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA || '';
  return {
    version: `${major}.${minor}.${count || '0'}`,
    buildHash: sha ? sha.slice(0, 7) : git('rev-parse --short HEAD'),
    buildDate: new Date().toISOString().split('T')[0]
  };
};

const { version: appVersion, buildHash, buildDate } = getBuildInfo(packageJson.version);
// ----------------------------------------------------------------------------------------------

// Writes dist/version.json so the running app can fetch it (cache-busted, bypassing
// the service worker's asset cache) to detect when a newer build has been deployed.
const versionManifestPlugin = (): Plugin => ({
  name: 'write-version-manifest',
  apply: 'build',
  closeBundle() {
    const outDir = resolve(import.meta.dirname, 'dist')
    writeFileSync(
      resolve(outDir, 'version.json'),
      JSON.stringify({ version: appVersion, buildHash, buildDate })
    )
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionManifestPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
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
