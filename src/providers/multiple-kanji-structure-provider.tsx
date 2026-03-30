import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import assetsPaths from "@/lib/assets-paths";
import {
  KanjiStructureData,
  KanjiumData,
  ComponentListData,
  MultiKanjiStructureEntry,
} from "@/lib/kanji-section-constants";

type Status = "idle" | "pending" | "success" | "error";

interface MultiKanjiStructureContextValue {
  status: Status;
  error: Error | null;
  getStructureForKanji: (kanji: string) => MultiKanjiStructureEntry | null;
}

const MultiKanjiStructureContext =
  createContext<MultiKanjiStructureContextValue | null>(null);

interface RawData {
  hlorenzi: KanjiStructureData;
  kanjium: KanjiumData;
  scott: ComponentListData;
  yagays: ComponentListData;
}

const fetchJson = async <T,>(path: string): Promise<T> => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json() as Promise<T>;
};

export const MultiKanjiStructureProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [rawData, setRawData] = useState<RawData | null>(null);

  useEffect(() => {
    setStatus("pending");
    Promise.all([
      fetchJson<KanjiStructureData>(assetsPaths.KANJI_STRUCTURE_DETAILS),
      fetchJson<KanjiumData>(assetsPaths.KANJI_STRUCTURE_KANJIUM),
      fetchJson<ComponentListData>(assetsPaths.KANJI_STRUCTURE_SCOTT),
      fetchJson<ComponentListData>(assetsPaths.KANJI_STRUCTURE_YAGAYS),
    ])
      .then(([hlorenzi, kanjium, scott, yagays]) => {
        setRawData({ hlorenzi, kanjium, scott, yagays });
        setStatus("success");
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      });
  }, []);

  const getStructureForKanji = useCallback(
    (kanji: string): MultiKanjiStructureEntry | null => {
      if (!rawData || !kanji) return null;
      const h = rawData.hlorenzi[kanji] ?? null;
      const k = rawData.kanjium[kanji] ?? null;
      const s = rawData.scott[kanji] ?? null;
      const y = rawData.yagays[kanji] ?? null;
      if (!h && !k && !s && !y) return null;
      return { hlorenzi: h, kanjium: k, scott: s, yagays: y };
    },
    [rawData],
  );

  const value = useMemo(
    () => ({ status, error, getStructureForKanji }),
    [status, error, getStructureForKanji],
  );

  return (
    <MultiKanjiStructureContext.Provider value={value}>
      {children}
    </MultiKanjiStructureContext.Provider>
  );
};

export const useMultiKanjiStructureContext = () => {
  const context = useContext(MultiKanjiStructureContext);
  if (!context) {
    throw new Error(
      "useMultiKanjiStructureContext must be used within a MultiKanjiStructureProvider",
    );
  }
  return context;
};

export const useMultiKanjiStructure = (kanji: string) => {
  const { status, error, getStructureForKanji } =
    useMultiKanjiStructureContext();

  return useMemo(
    () => ({
      kanjiStructureData: getStructureForKanji(kanji),
      status,
      error,
    }),
    [getStructureForKanji, kanji, status, error],
  );
};
