import { useEffect, useState } from "react";
import type { RecentFailedOperation } from "engine-contract";
import { useFailedOpsCount } from "@/lib/engine/sync-queries";
import { useEngineApi } from "@/lib/engine/use-engine-query";

export type RecentFailedOperations =
  | { kind: "loading" }
  | { kind: "ready"; operations: readonly RecentFailedOperation[] }
  | { kind: "error" };

/**
 * `sync.recentFailedOperations()` is a one-shot promise, not a store, so it is
 * fetched again whenever the live failed-operations count changes (and when
 * `reload()` is called after a dismiss). The previous list stays on screen
 * while a refetch runs.
 */
export const useRecentFailedOperations = () => {
  const api = useEngineApi();
  const count = useFailedOpsCount();
  const [result, setResult] = useState<RecentFailedOperations>({
    kind: "loading",
  });
  const [reloads, setReloads] = useState(0);
  const changeKey = `${count?.count}:${count?.lastUpdatedAt}`;

  // Effect needed: recentFailedOperations() is an async one-shot call with no
  // subscription, so it must be re-run when the count (or a reload) changes,
  // and a stale response must be ignored after cleanup.
  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    api.sync
      .recentFailedOperations()
      .then((operations) => {
        if (!cancelled) setResult({ kind: "ready", operations });
      })
      .catch(() => {
        if (!cancelled) setResult({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [api, changeKey, reloads]);

  return { result, reload: () => setReloads((n) => n + 1) };
};
