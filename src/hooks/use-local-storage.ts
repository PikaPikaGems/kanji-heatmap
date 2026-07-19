import { useCallback, useRef } from "react";
import { safeReadJson, notifyStorage } from "@/lib/storage";
import { useStorageValue } from "./use-storage-value";

type DispatchFunction<T> = (key: keyof T, value: T[keyof T]) => void;

const readFromStorage = <T>(storageKey: string, defaultValue: T): T => {
  // Seed storage with the default the first time the key is read.
  if (localStorage.getItem(storageKey) == null) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultValue));
    } catch {
      // ignore write failures (e.g. private mode quota)
    }
    return defaultValue;
  }
  return safeReadJson(storageKey, defaultValue);
};

/**
 * Boolean flag backed by a single localStorage key ("true" when set, absent
 * otherwise). Stays reactive across hook instances and browser tabs (via
 * useStorageValue) and re-reads when `storageKey` itself changes — e.g. a
 * per-word bookmark toggle whose key depends on the current word.
 */
export function useLocalStorageFlag(storageKey: string) {
  const value = useStorageValue(
    () => localStorage.getItem(storageKey) === "true",
    (key) => key === storageKey,
    storageKey
  );

  const set = useCallback(
    (next: boolean) => {
      if (next) {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }
      notifyStorage(storageKey);
    },
    [storageKey]
  );

  return [value, set] as [boolean, (next: boolean) => void];
}

/**
 * Object settings backed by a localStorage key. The default is seeded on first
 * read; each write merges one key and persists. Stays in sync across hook
 * instances on the same key and across tabs (via useStorageValue).
 */
export function useLocalStorage<T>(storageKey: string, defaultValue: T) {
  const defaultValueRef = useRef(defaultValue);

  const storageData = useStorageValue<T>(
    () => readFromStorage(storageKey, defaultValueRef.current),
    (key) => key === storageKey,
    storageKey
  );

  const setItem = useCallback<DispatchFunction<T>>(
    (key, value) => {
      const current = readFromStorage(storageKey, defaultValueRef.current);
      const newData = { ...current, [key]: value };
      localStorage.setItem(storageKey, JSON.stringify(newData));
      // Notify same-page instances (and this one) to re-read. The browser only
      // fires StorageEvent across tabs automatically.
      notifyStorage(storageKey);
    },
    [storageKey]
  );

  return [storageData, setItem] as [T, DispatchFunction<T>];
}
