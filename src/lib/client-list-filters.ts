import { FilterSettings } from "@/lib/settings/settings";

/** True when list results need main-thread filtering after the worker search. */
export const needsClientListFilters = (filters: FilterSettings) =>
  filters.bookmarkedOnly || filters.withAnchorWordsOnly;

/** Anything that can answer "is this kanji in the set?". */
type Membership = { has: (kanji: string) => boolean };

/**
 * Apply bookmark / anchor-word filters that the worker search cannot express
 * (localStorage bookmarks, and the anchor-word toggle).
 */
export const applyClientListFilters = (
  kanjis: string[],
  filters: FilterSettings,
  ctx: {
    bookmarkedKanji: Membership;
    kanjiWithAnchorWords: Membership | null;
  }
): string[] => {
  let result = kanjis;

  if (filters.bookmarkedOnly) {
    result = result.filter((kanji) => ctx.bookmarkedKanji.has(kanji));
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
