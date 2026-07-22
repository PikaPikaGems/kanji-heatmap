import { FilterSettings } from "@/lib/settings/settings";

/** True when list results need main-thread filtering after the worker search. */
export const needsClientListFilters = (filters: FilterSettings) =>
  filters.bookmarkedOnly || filters.withAnchorWordsOnly;

/**
 * Apply bookmark / anchor-word filters that the kanji worker cannot see
 * (localStorage bookmarks + representative-word JSON).
 */
export const applyClientListFilters = (
  kanjis: string[],
  filters: FilterSettings,
  ctx: {
    bookmarkedKanji: ReadonlySet<string>;
    kanjiWithAnchorWords: ReadonlySet<string> | null;
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
