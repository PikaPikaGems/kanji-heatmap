/** Last-resort refresh: new app shell, same URL state, keep runtime caches. */
export async function forceHardRefresh() {
  const url = new URL(window.location.href);
  // Bust HTTP cache of index.html without dropping search params.
  url.searchParams.set("nocache", String(Date.now()));

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

  window.location.replace(url.toString());
}
