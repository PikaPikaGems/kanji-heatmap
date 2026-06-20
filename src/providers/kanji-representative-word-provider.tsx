import { createContext, useContext, useMemo, ReactNode, useCallback } from "react";
import { useJsonFetch } from "@/hooks/use-json";
import assetsPaths from "@/lib/assets-paths";

// [word, reading, enTranslation, emojiTag]
type RepresentativeWordEntry = [string, string, string, string];

interface RepresentativeWordData {
  word: string;
  reading: string;
  englishGloss: string;
  tags: string[];
}

interface KanjiRepresentativeWordContextValue {
  data: Record<string, RepresentativeWordEntry> | null;
  status: "idle" | "pending" | "success" | "error";
  error: Error | null;
  getRepresentativeWord: (kanji: string) => RepresentativeWordData | null;
}

const KanjiRepresentativeWordContext =
  createContext<KanjiRepresentativeWordContextValue | null>(null);

export const KanjiRepresentativeWordProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { data, status, error } = useJsonFetch<Record<string, RepresentativeWordEntry>>(
    assetsPaths.KANJI_REPRESENTATIVE_WORDS
  );

  const getRepresentativeWord = useCallback(
    (kanji: string): RepresentativeWordData | null => {
      if (!data || !kanji) return null;
      const entry = data[kanji];
      if (!entry) return null;
      const [word, reading, englishGloss, emojiTag] = entry;
      return {
        word,
        reading,
        englishGloss,
        tags: emojiTag ? [emojiTag] : [],
      };
    },
    [data]
  );

  const value = useMemo(
    () => ({ data, status, error, getRepresentativeWord }),
    [data, status, error, getRepresentativeWord]
  );

  return (
    <KanjiRepresentativeWordContext.Provider value={value}>
      {children}
    </KanjiRepresentativeWordContext.Provider>
  );
};

const useKanjiRepresentativeWordContext = () => {
  const context = useContext(KanjiRepresentativeWordContext);
  if (!context) {
    throw new Error(
      "useKanjiRepresentativeWordContext must be used within a KanjiRepresentativeWordProvider"
    );
  }
  return context;
};

export const useKanjiRepresentativeWord = (kanji: string): RepresentativeWordData | null => {
  const { getRepresentativeWord } = useKanjiRepresentativeWordContext();
  return useMemo(() => getRepresentativeWord(kanji), [getRepresentativeWord, kanji]);
};

export const useGetRepresentativeWordFn = () => {
  const { getRepresentativeWord } = useKanjiRepresentativeWordContext();
  return getRepresentativeWord;
};
