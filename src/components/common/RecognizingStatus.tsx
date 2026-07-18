import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 200;
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

/** Label with a delayed 10ms count-up that only appears after `delayMs`. */
export const RecognizingStatus = ({
  label,
  delayMs = DEFAULT_DELAY_MS,
}: {
  label: string;
  delayMs?: number;
}) => {
  const elapsedMs = useDelayedElapsedMs(delayMs);

  return (
    <span className="inline-flex items-baseline justify-center gap-2">
      <span>{label}</span>
      {elapsedMs != null ? (
        <span className="tabular-nums opacity-70 animate-fade-in">
          {elapsedMs}ms
        </span>
      ) : null}
    </span>
  );
};
