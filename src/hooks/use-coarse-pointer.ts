import { useEffect, useState } from "react";

const COARSE_POINTER_QUERY = "(pointer: coarse)";

const getCoarsePointerMatch = () => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(COARSE_POINTER_QUERY).matches;
};

/**
 * True when the primary pointing device is coarse (typically a finger).
 * Prefer this over viewport width or `touchstart` for “phone-like” UX —
 * touch laptops stay fine-pointer; phones/tablets report coarse.
 */
export function useCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(getCoarsePointerMatch);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(COARSE_POINTER_QUERY);
    const update = () => setIsCoarse(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isCoarse;
}
