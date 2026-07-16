/**
 * Safely reads and JSON-parses a localStorage value, returning `fallback` when
 * the key is missing or the stored value can't be parsed (or storage throws,
 * e.g. private-mode restrictions).
 */
export const safeReadJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Notifies same-page listeners of a storage write. The browser fires
 * StorageEvent automatically across tabs, but same-page `window` listeners
 * (e.g. other useLocalStorage instances on the same key) need this explicit
 * dispatch.
 */
export const notifyStorage = (key: string) => {
  window.dispatchEvent(new StorageEvent("storage", { key }));
};
