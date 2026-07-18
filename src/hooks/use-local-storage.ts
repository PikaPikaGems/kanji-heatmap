import { useState, useCallback, useEffect, useRef } from "react";
import { safeReadJson, notifyStorage } from "@/lib/storage";

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

export function useLocalStorage2(storageKey: string) {
  const [value, setValue] = useState(
    () => localStorage.getItem(storageKey) === "true"
  );

  // Re-read when the key changes, during render (React's previous-state
  // pattern) instead of a sync effect.
  const [prevKey, setPrevKey] = useState(storageKey);
  if (prevKey !== storageKey) {
    setPrevKey(storageKey);
    setValue(localStorage.getItem(storageKey) === "true");
  }

  const set = useCallback(
    (next: boolean) => {
      if (next) {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }
      setValue(next);
      notifyStorage(storageKey);
    },
    [storageKey]
  );

  return [value, set] as [boolean, (next: boolean) => void];
}

export function useLocalStorage<T>(storageKey: string, defaultValue: T) {
  const defaultValueRef = useRef(defaultValue);

  const [storageData, setStorageData] = useState<T>(() =>
    readFromStorage(storageKey, defaultValueRef.current)
  );

  useEffect(() => {
    // Re-read on mount (handles storageKey changes) and whenever another hook
    // instance or another browser tab writes to the same key. This keeps two
    // components that share a storageKey (e.g. a settings form and its consumer)
    // in sync without lifting state.
    setStorageData(readFromStorage(storageKey, defaultValueRef.current));

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setStorageData(readFromStorage(storageKey, defaultValueRef.current));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const setItem = useCallback<DispatchFunction<T>>(
    (key, value) => {
      setStorageData((prevData) => {
        const newData = { ...prevData, [key]: value };
        localStorage.setItem(storageKey, JSON.stringify(newData));
        // Notify other hook instances on the same key (and the listener above).
        // The browser only fires StorageEvent cross-tab automatically;
        // same-page listeners need an explicit dispatch.
        notifyStorage(storageKey);
        return newData;
      });
    },
    [storageKey]
  );

  return [storageData, setItem] as [T, DispatchFunction<T>];
}
