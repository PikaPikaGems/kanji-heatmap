import { JLPTOptionsCount, JLTPTtypes } from "@/lib/jlpt";
import { isBookmarked } from "@/lib/bookmarks";
import { shuffle } from "@/lib/utils";
import { NUMBER_OF_FONTS } from "@/hooks/use-change-font";
import { DeckFilterSettings, PracticeItem } from "./types";

type RepEntry = [string, string, string, string];

export const buildPracticeDeck = ({
  repWords,
  getJlpt,
  getKeyword,
  settings,
}: {
  repWords: Record<string, RepEntry>;
  getJlpt: (kanji: string) => JLTPTtypes | null;
  getKeyword: (kanji: string) => string;
  settings: DeckFilterSettings;
}): PracticeItem[] => {
  const jlptSet = new Set(settings.jlpt);
  const applyJlpt = jlptSet.size > 0 && jlptSet.size < JLPTOptionsCount;

  const items: PracticeItem[] = [];

  for (const [kanji, entry] of Object.entries(repWords)) {
    // Some kanji keys exist with a null entry (no anchor word selected).
    if (!Array.isArray(entry)) continue;
    const [word, reading, englishGloss] = entry;
    if (!word || !reading) continue;

    const jlpt = getJlpt(kanji);
    if (jlpt == null) continue;
    if (applyJlpt && !jlptSet.has(jlpt)) continue;
    if (settings.bookmarkedOnly && !isBookmarked(kanji, word)) continue;

    items.push({
      kanji,
      word,
      reading,
      englishGloss: englishGloss ?? "",
      keyword: getKeyword(kanji) || "...",
      fontIndex: settings.randomizeFont
        ? Math.floor(Math.random() * NUMBER_OF_FONTS)
        : null,
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
    fontIndex: Math.floor(Math.random() * NUMBER_OF_FONTS),
  }));
};
