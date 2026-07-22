import { isBookmarked } from "@/lib/bookmarks";
import { shuffle } from "@/lib/utils";
import { randomFontIndex } from "@/hooks/use-change-font";
import { DeckFilterSettings, PracticeItem } from "./types";

type RepEntry = [string, string, string, string];

export const buildPracticeDeck = ({
  repWords,
  includedKanji,
  getKeyword,
  settings,
}: {
  repWords: Record<string, RepEntry>;
  includedKanji: ReadonlySet<string>;
  getKeyword: (kanji: string) => string;
  settings: DeckFilterSettings;
}): PracticeItem[] => {
  const items: PracticeItem[] = [];

  for (const [kanji, entry] of Object.entries(repWords)) {
    // Some kanji keys exist with a null entry (no anchor word selected).
    if (!Array.isArray(entry)) continue;
    const [word, reading, englishGloss] = entry;
    if (!word || !reading) continue;

    if (!includedKanji.has(kanji)) continue;
    if (settings.bookmarkedOnly && !isBookmarked(kanji, word)) continue;

    items.push({
      kanji,
      word,
      reading,
      englishGloss: englishGloss ?? "",
      keyword: getKeyword(kanji) || "...",
      fontIndex: settings.randomizeFont ? randomFontIndex() : null,
    });
  }

  return settings.randomizeOrder ? shuffle(items) : items;
};

/** Re-assign fonts when reshuffling with randomizeFont on. */
export const withFreshFonts = (
  items: PracticeItem[],
  randomizeFont: boolean
): PracticeItem[] => {
  if (!randomizeFont) {
    return items.map((item) => ({ ...item, fontIndex: null }));
  }
  return items.map((item) => ({
    ...item,
    fontIndex: randomFontIndex(),
  }));
};
