import { shuffle } from "@/lib/utils";
import { randomFontIndex } from "@/hooks/use-change-font";
import type { AnchorWordBasics } from "@/lib/kanji/anchor-words";
import { DeckFilterSettings, PracticeItem, PracticeWord } from "./types";

/** An anchor word as a practice card shows it. */
export const toPracticeWord = ({
  word,
  readings,
  englishGloss,
}: AnchorWordBasics): PracticeWord => ({
  word,
  reading: readings.join("・"),
  englishGloss,
});

export const buildPracticeDeck = ({
  words,
  secondaryWords,
  includedKanji,
  bookmarkedKanji,
  getKeyword,
  settings,
}: {
  /** The anchor word to practice, per kanji. */
  words: Record<string, AnchorWordBasics>;
  /** Shown next to `words` (the writing games); omitted by reading games. */
  secondaryWords?: Record<string, AnchorWordBasics>;
  includedKanji: ReadonlySet<string>;
  /** The account's bookmarks; omitted when this build has none (filter skipped). */
  bookmarkedKanji?: ReadonlySet<string>;
  getKeyword: (kanji: string) => string;
  settings: DeckFilterSettings;
}): PracticeItem[] => {
  const items: PracticeItem[] = [];

  for (const [kanji, anchor] of Object.entries(words)) {
    if (!anchor.word || anchor.readings.length === 0) continue;

    if (!includedKanji.has(kanji)) continue;
    if (
      settings.bookmarkedOnly &&
      bookmarkedKanji &&
      !bookmarkedKanji.has(kanji)
    ) {
      continue;
    }

    const secondary = secondaryWords?.[kanji];
    items.push({
      kanji,
      ...toPracticeWord(anchor),
      keyword: getKeyword(kanji) || "...",
      fontIndex: settings.randomizeFont ? randomFontIndex() : null,
      ...(secondary ? { secondary: toPracticeWord(secondary) } : {}),
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
