import {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

// Types for vocab data
export type WordPartDetail = [string, string?]; // [kanji/kana, reading?]

export interface VocabInfo {
  meaning: string;
  parts: WordPartDetail[];
}

export type VocabFuriganaData = Record<string, WordPartDetail[]>;
export type VocabMeaningData = Record<string, string>;

type Status = "idle" | "pending" | "success" | "error";

// Context
interface VocabDataContextValue {
  status: Status;
  error: Error | null;
  getVocabInfo: (word: string) => VocabInfo | null;
}

const VocabDataContext = createContext<VocabDataContextValue | null>(null);

// Provider
export const VocabDataProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [furiganaData, setFuriganaData] = useState<VocabFuriganaData | null>(
    null
  );
  const [meaningData, setMeaningData] = useState<VocabMeaningData | null>(null);

  useEffect(() => {
    setStatus("pending");

    Promise.all([
      fetch("/json/vocab_furigana.json").then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch vocab_furigana.json`);
        return res.json() as Promise<VocabFuriganaData>;
      }),
      fetch("/json/vocab_meaning.json").then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch vocab_meaning.json`);
        return res.json() as Promise<VocabMeaningData>;
      }),
    ])
      .then(([furigana, meanings]) => {
        setFuriganaData(furigana);
        setMeaningData(meanings);
        setStatus("success");
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      });
  }, []);

  const getVocabInfo = useCallback(
    (word: string): VocabInfo | null => {
      if (!furiganaData || !meaningData || !word) {
        return null;
      }

      const parts = furiganaData[word];
      const meaning = meaningData[word];

      if (!parts) {
        return null;
      }

      return {
        meaning: meaning || "",
        parts,
      };
    },
    [furiganaData, meaningData]
  );

  const value = useMemo(
    () => ({
      status,
      error,
      getVocabInfo,
    }),
    [status, error, getVocabInfo]
  );

  return (
    <VocabDataContext.Provider value={value}>
      {children}
    </VocabDataContext.Provider>
  );
};

// Hook to access the context
export const useVocabDataContext = () => {
  const context = useContext(VocabDataContext);
  if (!context) {
    throw new Error(
      "useVocabDataContext must be used within a VocabDataProvider"
    );
  }
  return context;
};

// Hook to get vocab info for a specific word
export const useVocabDetails = (word: string) => {
  const { status, error, getVocabInfo } = useVocabDataContext();

  const vocabInfo = useMemo(() => {
    return getVocabInfo(word);
  }, [getVocabInfo, word]);

  return {
    status,
    error,
    vocabInfo,
  };
};
