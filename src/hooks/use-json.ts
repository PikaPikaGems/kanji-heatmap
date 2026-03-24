import { useState, useEffect, useCallback } from "react";

// Define the possible status values
type Status = "idle" | "pending" | "success" | "error";

/**
 * A custom hook for asynchronous operations, specifically designed for fetching JSON files
 *
 * @template T The type of the returned value from the async function
 * @param {() => Promise<T>} asyncFunction - The async function to execute
 * @param {Array<any>} dependencies - Dependencies array for useEffect (optional)
 * @param {boolean} immediate - Whether to execute the function immediately (default: true)
 * @returns {Object} - { execute, status, value, error }
 */
export const useAsync = <T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): {
  execute: () => Promise<T>;
  status: Status;
  data: T | null;
  error: Error | null;
} => {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (): Promise<T> => {
    setStatus("pending");
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus("success");
      return response;
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      setStatus("error");
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
};

/**
 * A specialized hook for fetching JSON from the public folder
 *
 * @template T The expected type of the JSON data
 * @param {string} path - Path to the JSON file in the public folder
 * @param {Array<any>} dependencies - Dependencies array for useEffect (optional)
 * @param {boolean} immediate - Whether to fetch immediately (default: true)
 * @returns {Object} - { execute, status, data, error, isLoading, isSuccess, isError }
 */
export const useJsonFetch = <T>(
  path: string,
  immediate: boolean = true
): {
  execute: () => Promise<T>;
  status: Status;
  data: T | null;
  error: Error | null;
} => {
  // Wrap fetchJson in useCallback to maintain referential equality
  const fetchJson = useCallback(async (): Promise<T> => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch JSON: ${response.status} ${response.statusText}`
      );
    }
    return response.json() as Promise<T>;
  }, [path]);

  const value = useAsync<T>(fetchJson, immediate);

  return value;
};
