import { useState, useEffect } from "react";

/**
 * React hook that returns the window dimensions
 * @param debounceTime - Optional debounce time in milliseconds (default: 0)
 * @returns [windowWidth, windowHeight] - Current window dimensions
 */
export function useWindowSize(debounceTime = 300) {
  const [windowSize, setWindowSize] = useState<[number, number]>(() => {
    if (typeof window !== "undefined") {
      return [window.innerWidth, window.innerHeight];
    }
    return [0, 0];
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    function handleResize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize([window.innerWidth, window.innerHeight]);
      }, debounceTime);
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceTime]);

  return windowSize;
}
