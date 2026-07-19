import { createKanjiLookupProvider } from "./create-kanji-lookup-provider";
import assetsPaths from "@/lib/assets-paths";

// [word, reading, enTranslation, emojiTag]
type RepresentativeWordEntry = [string, string, string, string];

interface RepresentativeWordData {
  word: string;
  reading: string;
  englishGloss: string;
  tags: string[];
}

const representativeWord = createKanjiLookupProvider<
  [Record<string, RepresentativeWordEntry>],
  RepresentativeWordData
>({
  name: "KanjiRepresentativeWord",
  assetPaths: [assetsPaths.KANJI_REPRESENTATIVE_WORDS],
  select: ([data], kanji) => {
    const entry = data[kanji];
    if (!entry) {
      return null;
    }
    const [word, reading, englishGloss, emojiTag] = entry;
    return {
      word,
      reading,
      englishGloss,
      tags: emojiTag ? [emojiTag] : [],
    };
  },
});

export const KanjiRepresentativeWordProvider = representativeWord.Provider;

export const useKanjiRepresentativeWord = representativeWord.useLookup;

export const useGetRepresentativeWordFn = representativeWord.useLookupFn;
