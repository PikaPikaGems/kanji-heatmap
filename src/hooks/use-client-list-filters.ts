import { useMemo } from "react";
import { useBookmarkedKanji } from "@/hooks/use-bookmarked-kanji";
import { useJsonFetch } from "@/hooks/use-json";
import assetsPaths from "@/lib/assets-paths";
import {
  applyClientListFilters,
  needsClientListFilters,
} from "@/lib/client-list-filters";
import { FilterSettings } from "@/lib/settings/settings";

type RepEntry = [string, string, string, string];

const isValidAnchorEntry = (entry: unknown): entry is RepEntry =>
  Array.isArray(entry) &&
  typeof entry[0] === "string" &&
  entry[0].length > 0 &&
  typeof entry[1] === "string" &&
  entry[1].length > 0;

/**
 * Loads the sets needed for list client-side filters (bookmarks always;
 * representative/anchor words only when that toggle is on).
 */
export const useClientListFilterContext = (filters: FilterSettings) => {
  const bookmarked = useBookmarkedKanji();
  const needsAnchorData = filters.withAnchorWordsOnly;
  const { data: repWords, status: repStatus } = useJsonFetch<
    Record<string, RepEntry | null>
  >(assetsPaths.KANJI_REPRESENTATIVE_WORDS, needsAnchorData);

  // Set identity must stay stable: filtered lists depend on reference equality.
  const bookmarkedKanji = useMemo(() => new Set(bookmarked), [bookmarked]);

  // Building the ~2k-entry set every render is wasted work while JSON is cached.
  const kanjiWithAnchorWords = useMemo(() => {
    if (!needsAnchorData) return null;
    if (!repWords) return null;
    const set = new Set<string>();
    for (const [kanji, entry] of Object.entries(repWords)) {
      if (isValidAnchorEntry(entry)) {
        set.add(kanji);
      }
    }
    return set;
  }, [needsAnchorData, repWords]);

  const isLoading =
    needsAnchorData && (repStatus === "idle" || repStatus === "pending");

  return {
    isActive: needsClientListFilters(filters),
    isLoading,
    bookmarkedKanji,
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
