import { createKanjiLookupProvider } from "./create-kanji-lookup-provider";
import assetsPaths from "@/lib/assets-paths";
import {
  KanjiStructureData,
  KanjiumData,
  ComponentListData,
  MultiKanjiStructureEntry,
} from "@/lib/kanji-section-constants";

export const multiStructure = createKanjiLookupProvider<
  [KanjiStructureData, KanjiumData, ComponentListData, ComponentListData],
  MultiKanjiStructureEntry
>({
  name: "MultiKanjiStructure",
  assetPaths: [
    assetsPaths.KANJI_STRUCTURE_DETAILS,
    assetsPaths.KANJI_STRUCTURE_KANJIUM,
    assetsPaths.KANJI_STRUCTURE_SCOTT,
    assetsPaths.KANJI_STRUCTURE_YAGAYS,
  ],
  select: ([hlorenzi, kanjium, scott, yagays], kanji) => {
    const h = hlorenzi[kanji] ?? null;
    const k = kanjium[kanji] ?? null;
    const s = scott[kanji] ?? null;
    const y = yagays[kanji] ?? null;
    if (!h && !k && !s && !y) {
      return null;
    }
    return { hlorenzi: h, kanjium: k, scott: s, yagays: y };
  },
});

export const useMultiKanjiStructure = (kanji: string) => {
  const { status, error, data } = multiStructure.useLookupState(kanji);
  return { kanjiStructureData: data, status, error };
};
