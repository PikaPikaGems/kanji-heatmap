import type { CardType, UTCTimestamp } from "engine-contract";
import { cardProgress } from "@/lib/engine/card-types";
import { snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { REVIEW_PILE_ALL_KEY } from "@/lib/engine/use-due-count";

/**
 * When the next card of this type comes due: the earliest future `dueAt` in
 * the review pile. `null` when no card is scheduled, `undefined` while the
 * pile is loading.
 */
export const useNextDueAt = (
  cardType: CardType
): UTCTimestamp | null | undefined => {
  const pile = snapshotValue(
    useEngineQuery(REVIEW_PILE_ALL_KEY, (api) => api.reviews.pile.watchAll())
  );
  if (pile == null) return undefined;

  // Timestamps are fixed-width UTC strings, so they compare as strings.
  const now = new Date().toISOString();
  let earliest: UTCTimestamp | null = null;
  for (const item of pile) {
    const dueAt = cardProgress(item, cardType)?.dueAt;
    if (dueAt == null || dueAt <= now) continue;
    if (earliest == null || dueAt < earliest) earliest = dueAt;
  }
  return earliest;
};
