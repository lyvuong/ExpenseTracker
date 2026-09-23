import { APP_VERSION, BUILD_HASH } from './version';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion?: string;
}

// Fetches the version manifest written at build time (see vite.config.ts), cache-busted
// so the request always reaches the network instead of the service worker's asset cache.
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const res = await fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Version check failed (${res.status})`);
  }
  const data = await res.json();
  const latestVersion: string | undefined = data.version;
  const latestBuildHash: string | undefined = data.buildHash;

  // Build hash (git commit) is the precise signal; version number is a fallback
  // for builds where no hash is available.
  if (BUILD_HASH && latestBuildHash) {
    return { hasUpdate: latestBuildHash !== BUILD_HASH, latestVersion };
  }
  return { hasUpdate: !!latestVersion && latestVersion !== APP_VERSION, latestVersion };
}

// Drops the installed service worker + its caches so the next load fetches everything
// fresh, then reloads the page to pick up the new build.
export async function installLatestVersion(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } finally {
    window.location.reload();
  }
}
