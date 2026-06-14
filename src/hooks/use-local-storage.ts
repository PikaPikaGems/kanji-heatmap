import { useState, useCallback, useEffect, useRef } from "react";

type DispatchFunction<T> = (key: keyof T, value: T[keyof T]) => void;

const readFromStorage = <T>(storageKey: string, defaultValue: T): T => {
  try {
    const storedData = localStorage.getItem(storageKey);
    if (storedData == null) {
      localStorage.setItem(storageKey, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(storedData);
  } catch {
    return defaultValue;
  }
};

export function useLocalStorage<T>(storageKey: string, defaultValue: T) {
  const defaultValueRef = useRef(defaultValue);

  const [storageData, setStorageData] = useState<T>(() =>
    readFromStorage(storageKey, defaultValueRef.current)
  );

  useEffect(() => {
    setStorageData(readFromStorage(storageKey, defaultValueRef.current));
  }, [storageKey]);

  const setItem = useCallback<DispatchFunction<T>>(
    (key, value) => {
      setStorageData((prevData) => {
        const newData = { ...prevData, [key]: value };
        localStorage.setItem(storageKey, JSON.stringify(newData));
        return newData;
      });
    },
    [storageKey]
  );

  return [storageData, setItem] as [T, DispatchFunction<T>];
}
