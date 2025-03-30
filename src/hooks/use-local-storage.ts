import { useState, useCallback } from "react";

type DispatchFunction<T> = (key: keyof T, value: T[keyof T]) => void;

export function useLocalStorage<T>(storageKey: string, defaultValue: T) {
  const [storageData, setStorageData] = useState<T>(() => {
    try {
      const storedData = localStorage.getItem(storageKey);
      const result = storedData ? JSON.parse(storedData) : defaultValue;

      if (storedData == null) {
        localStorage.setItem(storageKey, JSON.stringify(defaultValue));
      }
      return result;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      try {
        localStorage.setItem(storageKey, JSON.stringify(defaultValue));
      } catch {
        return defaultValue;
      }
      return defaultValue;
    }
  });

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
