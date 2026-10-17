import { useMemo } from "react";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import {
  applyClientListFilters,
  needsClientListFilters,
} from "@/lib/client-list-filters";
import { useBookmarkedKanji } from "@/lib/engine/use-kanji-sets";
import { FilterSettings } from "@/lib/settings/settings";

/**
 * Loads the sets needed for list client-side filters (the account's
 * bookmarks; representative/anchor words only when that toggle is on).
 *
 * Anchor words used to mean fetching the 168 KB representative-word JSON on
 * the main thread; the worker snapshot already carries the word per kanji.
 */
export const useClientListFilterContext = (filters: FilterSettings) => {
  const bookmarks = useBookmarkedKanji();
  const getInfo = useGetKanjiInfoFn();
  const needsAnchorData = filters.withAnchorWordsOnly;

  // A membership predicate rather than a prebuilt set: the snapshot answers
  // per kanji, so there is nothing to enumerate up front.
  const kanjiWithAnchorWords = useMemo(() => {
    if (!needsAnchorData || getInfo == null) return null;
    return {
      has: (kanji: string) => {
        const word = getInfo(kanji)?.repWord;
        return word != null && word.length > 0;
      },
    };
  }, [needsAnchorData, getInfo]);

  const isLoading =
    (needsAnchorData && getInfo == null) ||
    (filters.bookmarkedOnly && bookmarks.status === "loading");

  return {
    isActive: needsClientListFilters(filters),
    isLoading,
    // Set identity is stable (see use-kanji-sets.ts): filtered lists depend on
    // reference equality. Null when this build has no bookmarks at all, so a
    // leftover "bookmarked only" setting doesn't empty the list.
    bookmarkedKanji: bookmarks.status === "absent" ? null : bookmarks.kanji,
    kanjiWithAnchorWords,
  };
};

/** Filter worker search results by bookmark / anchor-word toggles. */
export const useClientFilteredKanjis = (
  kanjis: string[] | undefined,
  filters: FilterSettings
): { data: string[] | undefined; isLoading: boolean } => {
  const ctx = useClientListFilterContext(filters);

  // Same rationale as KanjiListWithSearch: avoid a fresh array each render for
  // virtualized lists / memoized consumers when the inputs have not changed.
  const data = useMemo(() => {
    if (kanjis == null) return undefined;
    if (!ctx.isActive) return kanjis;
    if (ctx.isLoading) return undefined;
    return applyClientListFilters(kanjis, filters, {
      bookmarkedKanji: ctx.bookmarkedKanji,
      kanjiWithAnchorWords: ctx.kanjiWithAnchorWords,
    });
  }, [
    kanjis,
    filters,
    ctx.isActive,
    ctx.isLoading,
    ctx.bookmarkedKanji,
    ctx.kanjiWithAnchorWords,
  ]);

  return { data, isLoading: ctx.isActive && ctx.isLoading };
};
