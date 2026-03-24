import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from "react";
import { useJsonFetch } from "@/hooks/use-json";
import assetsPaths from "@/lib/assets-paths";
import { KanjiStructureData, KanjiStructureEntry } from "@/lib/kanji-section-constants";


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
  const jsonFetchValue = useJsonFetch<KanjiStructureData>(
    assetsPaths.KANJI_STRUCTURE_DETAILS
  );

  const value = useMemo(
    () => {
      const { data, status, error } = jsonFetchValue
      return {
        data,
        status,
        error,
        getStructureForKanji: (kanji: string): KanjiStructureEntry | null => {
          if (!data || !kanji) {
            return null;
          }
          return data[kanji] || null;
        }
      }
    },
    [jsonFetchValue]
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

export const useKanjiStructure = (kanji: string) => {
  const value = useKanjiStructureContext();

  const state = useMemo(() => {
    return {
      kanjiStructureData: value.getStructureForKanji(kanji),
      status: value.status,
      error: value.error
    }
  }, [value, kanji]);

  return state;
};
