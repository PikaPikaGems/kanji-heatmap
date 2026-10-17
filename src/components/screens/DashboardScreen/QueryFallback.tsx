import { ReactNode } from "react";
import type { EngineQuerySnapshot } from "@/lib/engine/use-engine-query";
import { isQueryFailed } from "./is-query-failed";

/**
 * Stands in for a dashboard panel's data until its engine reads are ready:
 * the panel's pulsing skeleton, or a short note when one of them failed.
 */
export const QueryFallback = ({
  snapshots,
  skeleton,
}: {
  snapshots: EngineQuerySnapshot<unknown>[];
  /** Shaped like the data it stands in for. */
  skeleton: ReactNode;
}) => {
  if (snapshots.some(isQueryFailed)) {
    return (
      <p className="py-6 text-sm font-bold text-center text-yellow-600 dark:text-yellow-400">
        Couldn&apos;t load your progress. Try again in a moment.
      </p>
    );
  }
  return (
    <div role="status" aria-label="Loading your progress">
      {skeleton}
    </div>
  );
};
