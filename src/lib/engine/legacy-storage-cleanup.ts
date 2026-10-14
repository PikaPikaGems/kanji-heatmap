/**
 * Study data the app kept in localStorage before the engine owned it. There is
 * no migration: these keys are deleted on every start. Nothing writes them
 * once the code that used them is gone, so after the first run this finds
 * nothing.
 *
 * Add a key or prefix here in the same change that removes its last writer.
 */
const LEGACY_KEYS: readonly string[] = [];
const LEGACY_KEY_PREFIXES: readonly string[] = [];

export const removeLegacyStudyData = () => {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    if (LEGACY_KEY_PREFIXES.length === 0) return;
    const stale = Object.keys(localStorage).filter((key) =>
      LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
    );
    for (const key of stale) localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable (private mode); nothing to clean then.
  }
};
