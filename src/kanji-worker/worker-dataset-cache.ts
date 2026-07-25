/**
 * Main-thread memo for whole-dataset worker requests.
 *
 * The worker already memoises each dataset (`lazyDataset`), so a repeat request
 * never refetches the file. But the *reply* still crosses the worker boundary
 * every time, and a structured clone of a 2,426-entry map is real work on both
 * threads. Datasets behind a collapsed accordion get re-requested every time
 * the section is expanded, because the body unmounts in between.
 *
 * Holding the resolved promise here makes the second and later expands free,
 * which is what the fetch-all-once providers this replaced used to give us via
 * a long-lived React context.
 *
 * Only for datasets that are whole maps and never change during a session.
 */
const cache = new Map<string, Promise<unknown>>();

export const oncePerSession = <T>(key: string, run: () => Promise<T>) => {
  const existing = cache.get(key);
  if (existing != null) {
    return existing as Promise<T>;
  }

  const pending = run().catch((error: unknown) => {
    // Drop the rejection so a retry can succeed; otherwise one failed fetch
    // would leave the section permanently broken for the whole session.
    cache.delete(key);
    throw error;
  });

  cache.set(key, pending);
  return pending;
};

/** Test seam: no production caller should need this. */
export const clearWorkerDatasetCache = () => cache.clear();
