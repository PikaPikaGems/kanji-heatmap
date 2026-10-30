import { FilterSettings } from "@/lib/settings/settings";

/** True when list results need main-thread filtering after the worker search. */
export const needsClientListFilters = (filters: FilterSettings) =>
  filters.bookmarkedOnly || filters.withAnchorWordsOnly;

/** Anything that can answer "is this kanji in the set?". */
type Membership = { has: (kanji: string) => boolean };

/**
 * Apply bookmark / anchor-word filters that the worker search cannot express
 * (the account's bookmarks, and the anchor-word toggle).
 */
export const applyClientListFilters = (
  kanjis: string[],
  filters: FilterSettings,
  ctx: {
    /** Null when bookmarks don't exist in this build: the filter is skipped. */
    bookmarkedKanji: Membership | null;
    kanjiWithAnchorWords: Membership | null;
  }
): string[] => {
  let result = kanjis;

  const bookmarked = ctx.bookmarkedKanji;
  if (filters.bookmarkedOnly && bookmarked != null) {
    result = result.filter((kanji) => bookmarked.has(kanji));
  }

  if (filters.withAnchorWordsOnly) {
    const withAnchor = ctx.kanjiWithAnchorWords;
    if (withAnchor == null) {
      return [];
    }
    result = result.filter((kanji) => withAnchor.has(kanji));
  }

  return result;
};
