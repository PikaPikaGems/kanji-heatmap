import type { EngineAPI, ReviewPileItemView } from "engine-contract";
import { getCachedStore } from "./store-cache";
import { type EngineQuerySnapshot, useEngineQuery } from "./use-engine-query";

const pileItemKey = (kanji: string) => `reviews.pile.watch:${kanji}`;

const createPileItemStore = (kanji: string) => (api: EngineAPI) =>
  api.reviews.pile.watch(kanji);

/**
 * One kanji's review-pile item (`reviews.pile.watch(kanji)`): the item when
 * it is in the pile, `null` when it is not. Shared by the drawer's pile button
 * and its "Your progress" accordion so both read the same cached store.
 */
export const useReviewPileItem = (
  kanji: string
): EngineQuerySnapshot<ReviewPileItemView | null> =>
  useEngineQuery(pileItemKey(kanji), createPileItemStore(kanji));

/** Reads the store again after a failed (retryable) snapshot. */
export const refreshReviewPileItem = (api: EngineAPI, kanji: string) =>
  getCachedStore(api, pileItemKey(kanji), createPileItemStore(kanji)).refresh();
