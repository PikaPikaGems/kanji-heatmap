import type { ReviewPileItemView } from "engine-contract";
import { type EngineQuerySnapshot, useEngineQuery } from "./use-engine-query";

/**
 * One kanji's review-pile item (`reviews.pile.watch(kanji)`): the item when
 * it is in the pile, `null` when it is not. Shared by the drawer's pile button
 * and its "Your progress" accordion so both read the same cached store.
 */
export const useReviewPileItem = (
  kanji: string
): EngineQuerySnapshot<ReviewPileItemView | null> =>
  useEngineQuery(`reviews.pile.watch:${kanji}`, (engine) =>
    engine.reviews.pile.watch(kanji)
  );
