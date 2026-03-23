import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { useJsonFetch } from "@/hooks/use-json";

export type StructuralType =
  | "shiji"
  | "shoukei"
  | "kaii"
  | "keisei"
  | "unknown"
  | "derivative"
  | "rebus"
  | "kokuji"
  | "shinjitai";

export interface KanjiStructureEntry {
  type: StructuralType;
  semantic?: string;
  phonetic?: string;
}

export type KanjiStructureData = Record<string, KanjiStructureEntry>;

// Context
interface KanjiStructureContextValue {
  data: KanjiStructureData | null;
  status: "idle" | "pending" | "success" | "error";
  error: Error | null;
  getStructureForKanji: (kanji: string) => KanjiStructureEntry | null;
}

const KanjiStructureContext = createContext<KanjiStructureContextValue | null>(
  null
);

// Provider
export const KanjiStructureProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { data, status, error } = useJsonFetch<KanjiStructureData>(
    "/json/kanji-structure.json"
  );

  const getStructureForKanji = useCallback(
    (kanji: string): KanjiStructureEntry | null => {
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
      getStructureForKanji,
    }),
    [data, status, error, getStructureForKanji]
  );

  return (
    <KanjiStructureContext.Provider value={value}>
      {children}
    </KanjiStructureContext.Provider>
  );
};

// Hook to access the context
export const useKanjiStructureContext = () => {
  const context = useContext(KanjiStructureContext);
  if (!context) {
    throw new Error(
      "useKanjiStructureContext must be used within a KanjiStructureProvider"
    );
  }
  return context;
};

// Hook to get structure data for a specific kanji
export const useKanjiStructure = (kanji: string) => {
  const { status, error, getStructureForKanji } = useKanjiStructureContext();

  const kanjiStructureData = useMemo(() => {
    return getStructureForKanji(kanji);
  }, [getStructureForKanji, kanji]);

  return {
    status,
    error,
    kanjiStructureData,
  };
};
