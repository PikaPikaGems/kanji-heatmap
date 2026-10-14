import KaomojiAnimation from "@/components/common/KaomojiLoading";
import type { EngineQuerySnapshot } from "@/lib/engine/use-engine-query";

const isFailed = (snapshot: EngineQuerySnapshot<unknown>) =>
  snapshot.status === "failed" ||
  (snapshot.status === "ready" && !snapshot.result.ok);

/**
 * Stands in for a dashboard panel's data until its engine reads are ready: a
 * loader, or a short note when one of them failed.
 */
export const QueryFallback = ({
  snapshots,
}: {
  snapshots: EngineQuerySnapshot<unknown>[];
}) => {
  if (snapshots.some(isFailed)) {
    return (
      <p className="py-6 text-sm text-center text-muted-foreground">
        Couldn&apos;t load your progress. Try again in a moment.
      </p>
    );
  }
  return (
    <div className="py-8">
      <KaomojiAnimation />
    </div>
  );
};
