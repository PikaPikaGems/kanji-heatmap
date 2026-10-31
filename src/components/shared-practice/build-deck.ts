import { shuffle } from "@/lib/utils";
import { randomFontIndex } from "@/hooks/use-change-font";
import type { AnchorWordBasics } from "@/lib/kanji/anchor-words";
import { DeckFilterSettings, PracticeItem } from "./types";

export const buildPracticeDeck = ({
  words,
  includedKanji,
  bookmarkedKanji,
  getKeyword,
  settings,
}: {
  /** The anchor word to practice, per kanji. */
  words: Record<string, AnchorWordBasics>;
  includedKanji: ReadonlySet<string>;
  /** The account's bookmarks; omitted when this build has none (filter skipped). */
  bookmarkedKanji?: ReadonlySet<string>;
  getKeyword: (kanji: string) => string;
  settings: DeckFilterSettings;
}): PracticeItem[] => {
  const items: PracticeItem[] = [];

  for (const [kanji, { word, readings, englishGloss }] of Object.entries(
    words
  )) {
    if (!word || readings.length === 0) continue;

    if (!includedKanji.has(kanji)) continue;
    if (
      settings.bookmarkedOnly &&
      bookmarkedKanji &&
      !bookmarkedKanji.has(kanji)
    ) {
      continue;
    }

    items.push({
      kanji,
      word,
      reading: readings.join("・"),
      englishGloss,
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
