/** Longest we wait on Service Worker / Cache API cleanup before navigating. */
const CLEANUP_TIMEOUT_MS = 1500;

/** Drop the Workbox precache and unregister the service worker. */
async function dropAppShell() {
  // Stop a stuck SW from serving the old shell on the next navigation.
  const regs = await navigator.serviceWorker?.getRegistrations?.();
  if (regs) await Promise.all(regs.map((r) => r.unregister()));

  // Precache is html/js/css only. Leave SVG, JSON, fonts, ONNX, etc.
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("workbox-precache"))
        .map((k) => caches.delete(k))
    );
  }
}

/** Last-resort refresh: new app shell, same URL state, keep runtime caches. */
export async function forceHardRefresh() {
  const url = new URL(window.location.href);
  // Bust HTTP cache of index.html without dropping search params.
  url.searchParams.set("nocache", String(Date.now()));

  // The cleanup is best effort: on iOS these calls can reject or never
  // settle, and the page must still reload (otherwise every tap is a no-op).
  try {
    await Promise.race([
      dropAppShell(),
      new Promise((resolve) => setTimeout(resolve, CLEANUP_TIMEOUT_MS)),
    ]);
  } catch {
    // Reload anyway.
  }

  window.location.replace(url.toString());
}
