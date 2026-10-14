import { useEffect, useState } from "react";
import type { CardType } from "engine-contract";
import { useAccountStatus } from "./use-account-status";
import { useEngineApi, useEngineQuery } from "./use-engine-query";

/** Cached-store key of `reviews.pile.watchAll()` (see store-cache.ts). */
export const REVIEW_PILE_ALL_KEY = "reviews.pile.watchAll";

const POLL_MS = 60_000;

export type DueCounts = Record<CardType, number>;

/**
 * Cards due right now, per card type. `null` until the first count arrives and
 * whenever there is no active account (so callers show nothing).
 *
 * `getDueCount` is a one-shot snapshot and the engine has no due timer, so it
 * is re-checked when the review pile changes, when the tab regains focus or
 * becomes visible, and every minute.
 */
export const useDueCount = (): DueCounts | null => {
  const api = useEngineApi();
  const account = useAccountStatus();
  const pile = useEngineQuery(REVIEW_PILE_ALL_KEY, (a) =>
    a.reviews.pile.watchAll()
  );
  const [counts, setCounts] = useState<DueCounts | null>(null);
  const active = account.kind === "active";

  // Effect needed: subscribes to window focus / document visibility and runs a
  // poll timer, none of which can be derived during render; `pile` is a
  // re-run trigger only (a new snapshot means a card's schedule changed).
  useEffect(() => {
    if (!api || !active) return;

    let cancelled = false;
    const refresh = () => {
      void Promise.all([
        api.reviews.getDueCount("reading"),
        api.reviews.getDueCount("writing"),
      ]).then(([reading, writing]) => {
        if (cancelled) return;
        const next = {
          reading: reading.ok ? reading.value : 0,
          writing: writing.ok ? writing.value : 0,
        };
        setCounts((prev) =>
          prev?.reading === next.reading && prev.writing === next.writing
            ? prev
            : next
        );
      });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const timer = window.setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(timer);
    };
  }, [api, active, pile]);

  return active ? counts : null;
};

/** Reading plus writing cards due; 0 while unknown. */
export const totalDue = (counts: DueCounts | null): number =>
  counts ? counts.reading + counts.writing : 0;
