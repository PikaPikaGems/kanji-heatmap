import { useEffect, useRef } from "react";

/**
 * Custom hook that returns the previous value of a variable
 * @template T The type of the value being tracked
 * @param {T} value - The value to track
 * @returns {T | undefined} The previous value of the tracked variable, undefined on first render
 */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export default usePrevious;
