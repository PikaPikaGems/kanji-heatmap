const RELOADED_AT_KEY = "kh-stale-chunk-reload-at";

/** Don't reload again within this window, so a real outage shows the error page instead of looping. */
const RETRY_WINDOW_MS = 30_000;

const lastReloadAt = () => {
  try {
    return Number(sessionStorage.getItem(RELOADED_AT_KEY) ?? 0);
  } catch {
    return 0;
  }
};

/**
 * After a deploy, a tab that was already open still runs the old build. Its
 * lazy chunks are gone (the new service worker drops them from its cache and
 * the server answers their old URLs with `index.html`), so the next lazy
 * screen fails to load and an error boundary shows. Vite fires
 * `vite:preloadError` for these: reload once to pick up the new build.
 */
export const reloadOnStaleChunk = () => {
  window.addEventListener("vite:preloadError", (event) => {
    if (Date.now() - lastReloadAt() < RETRY_WINDOW_MS) return;

    try {
      sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
    } catch {
      // No storage means no loop guard: let the error boundary show instead.
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
};
