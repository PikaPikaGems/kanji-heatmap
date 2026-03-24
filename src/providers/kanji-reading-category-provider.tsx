import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { useJsonFetch } from "@/hooks/use-json";
import assetsPaths from "@/lib/assets-paths";

import type { KanjiReadingEntry, KanjiReadingsData } from "@/lib/kanji-section-constants"

interface KanjiReadingCategoryContextValue {
  data: KanjiReadingsData | null;
  status: "idle" | "pending" | "success" | "error";
  error: Error | null;
  getReadingsForKanji: (kanji: string) => KanjiReadingEntry[] | null;
}

const KanjiReadingCategoryContext =
  createContext<KanjiReadingCategoryContextValue | null>(null);

export const KanjiReadingCategoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { data, status, error } = useJsonFetch<KanjiReadingsData>(
    assetsPaths.KANJI_READING_DETAILS
  );

  const getReadingsForKanji = useCallback(
    (kanji: string): KanjiReadingEntry[] | null => {
      if (!data || !kanji) {
        return null;
      }
      return data[kanji] || null;
    },
    [data]
  );

  const value = useMemo(
    () => ({
      data,
      status,
      error,
      getReadingsForKanji,
    }),
    [data, status, error, getReadingsForKanji]
  );

  return (
    <KanjiReadingCategoryContext.Provider value={value}>
      {children}
    </KanjiReadingCategoryContext.Provider>
  );
};

// Hook to access the context
export const useKanjiReadingCategoryContext = () => {
  const context = useContext(KanjiReadingCategoryContext);
  if (!context) {
    throw new Error(
      "useKanjiReadingCategoryContext must be used within a KanjiReadingCategoryProvider"
    );
  }
  return context;
};

// Hook to get reading data for a specific kanji
export const useKanjiReadingDetails = (kanji: string) => {
  const { status, error, getReadingsForKanji } =
    useKanjiReadingCategoryContext();

  const kanjiReadingData = useMemo(() => {
    return getReadingsForKanji(kanji);
  }, [getReadingsForKanji, kanji]);

  return {
    status,
    error,
    kanjiReadingData,
  };
};
