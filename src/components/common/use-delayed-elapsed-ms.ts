import { useEffect, useState } from "react";

export const DEFAULT_DELAY_MS = 200;
const STEP_MS = 10;

/**
 * Elapsed ms since mount, rounded down to STEP_MS.
 * Returns null until `delayMs` has passed so fast recognizes stay clean.
 */
export const useDelayedElapsedMs = (delayMs: number = DEFAULT_DELAY_MS) => {
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    let tickId: ReturnType<typeof setInterval> | undefined;

    const showId = window.setTimeout(() => {
      const update = () => {
        setElapsedMs(
          Math.floor((performance.now() - start) / STEP_MS) * STEP_MS
        );
      };
      update();
      tickId = setInterval(update, STEP_MS);
    }, delayMs);

    return () => {
      window.clearTimeout(showId);
      if (tickId != null) clearInterval(tickId);
    };
  }, [delayMs]);

  return elapsedMs;
};
