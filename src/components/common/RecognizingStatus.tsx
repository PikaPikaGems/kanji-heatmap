import {
  DEFAULT_DELAY_MS,
  useDelayedElapsedMs,
} from "./use-delayed-elapsed-ms";

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
