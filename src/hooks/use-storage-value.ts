import { useEffect, useRef, useState } from "react";

/**
 * Reactive read of a localStorage-derived value.
 *
 * `read` computes the current value; `matchesKey` decides which storage-event
 * keys trigger a re-read (`key` is null for storage.clear()). Same-tab writes
 * are picked up when the writer dispatches via `notifyStorage`; cross-tab
 * writes arrive from the browser automatically.
 *
 * Both callbacks are kept in refs, so callers may pass inline functions
 * without re-subscribing on every render.
 */
export const useStorageValue = <T>(
  read: () => T,
  matchesKey: (key: string | null) => boolean
): T => {
  const readRef = useRef(read);
  const matchesKeyRef = useRef(matchesKey);
  readRef.current = read;
  matchesKeyRef.current = matchesKey;

  const [value, setValue] = useState<T>(() => readRef.current());

  useEffect(() => {
    // Re-read on mount so a write between initial render and subscription
    // isn't missed.
    setValue(readRef.current());

    const onStorage = (e: StorageEvent) => {
      if (matchesKeyRef.current(e.key)) {
        setValue(readRef.current());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return value;
};

/**
 * Counter that increments on every matching storage event. For components
 * that don't read a value themselves but need to re-render (or remount a
 * child via `key`) when storage changes underneath it.
 */
export const useStorageRevision = (
  matchesKey: (key: string | null) => boolean
): number => {
  const matchesKeyRef = useRef(matchesKey);
  matchesKeyRef.current = matchesKey;

  const [revision, setRevision] = useState(0);

  // Effect needed: subscribes to the window storage event (cross-tab
  // natively, same-tab via notifyStorage).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (matchesKeyRef.current(e.key)) {
        setRevision((n) => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return revision;
};
