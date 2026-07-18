import { useEffect, useState } from "react";

export type GetStrokeFn = typeof import("perfect-freehand").getStroke;

/**
 * Lazily loads perfect-freehand (kept out of the main bundle) and returns its
 * `getStroke`, or null while the module is still loading.
 */
export const useGetStrokeFn = (): GetStrokeFn | null => {
  const [getStrokeFn, setGetStrokeFn] = useState<GetStrokeFn | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("perfect-freehand").then((m) => {
      if (!cancelled) {
        setGetStrokeFn(() => m.getStroke);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return getStrokeFn;
};
