/**
 * Generated voice samples, kept in the browser's Cache Storage so each
 * voice and setting combination is paid for once. Object URLs are reused
 * while the page is open.
 */
const CACHE_NAME = "ai-voice-samples-v1";
const urls = new Map<string, string>();

/** Cache Storage keys are requests: the sample key as a made-up URL. */
const requestOf = (key: string) =>
  `https://voice-sample.invalid/${encodeURIComponent(key)}`;

/** A sample's object URL, if it was made before; never throws. */
export const readVoiceSample = async (key: string) => {
  const known = urls.get(key);
  if (known) return known;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(requestOf(key));
    if (!response) return undefined;
    const url = URL.createObjectURL(await response.blob());
    urls.set(key, url);
    return url;
  } catch {
    // No Cache Storage (private mode, old browser): make it again when asked.
    return undefined;
  }
};

/** Saves a sample under each key and returns its object URL. */
export const writeVoiceSample = async (keys: string[], blob: Blob) => {
  const url = URL.createObjectURL(blob);
  for (const key of keys) urls.set(key, url);
  try {
    const cache = await caches.open(CACHE_NAME);
    for (const key of keys)
      await cache.put(
        requestOf(key),
        new Response(blob, { headers: { "Content-Type": blob.type } })
      );
  } catch {
    // Kept for this page only.
  }
  return url;
};

/** Forgets every sample, with the rest of the generated content. */
export const clearVoiceSamples = async () => {
  urls.clear();
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // Nothing was saved.
  }
};
