import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { useJsonFetch } from "@/hooks/use-json";

// Types for the kanji reading data
export type ReadingType = "ON" | "KUN";
export type FrequencyCategory = "↑" | "↔" | "↓";

export interface KanjiReadingEntry {
  reading: string;
  type: ReadingType;
  frequency: FrequencyCategory;
  example_word: string;
}

export type KanjiReadingsData = Record<string, KanjiReadingEntry[]>;

// Frequency display mappings
export const frequencyLabels: Record<FrequencyCategory, string> = {
  "↑": "Often Used",
  "↔": "Sometimes Used",
  "↓": "Almost Never Used",
};

export const frequencyColors: Record<FrequencyCategory, string> = {
  "↑": "text-green-500",
  "↔": "text-yellow-500",
  "↓": "text-red-500",
};

export const readingTypeLabels: Record<ReadingType, string> = {
  ON: "On'yomi",
  KUN: "Kun'yomi",
};

// Context
interface KanjiReadingCategoryContextValue {
  data: KanjiReadingsData | null;
  status: "idle" | "pending" | "success" | "error";
  error: Error | null;
  getReadingsForKanji: (kanji: string) => KanjiReadingEntry[] | null;
}

const KanjiReadingCategoryContext =
  createContext<KanjiReadingCategoryContextValue | null>(null);

// Provider
export const KanjiReadingCategoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { data, status, error } = useJsonFetch<KanjiReadingsData>(
    "/json/kanji-readings-details.json"
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
