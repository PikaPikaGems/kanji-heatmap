import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { useState, useEffect } from "react";

const useKnownCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const compute = () => {
      let n = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("known:")) {
          try {
            const val = JSON.parse(localStorage.getItem(key) ?? "{}");
            if (val.known) n++;
          } catch {
            // ignore malformed entries
          }
        }
      }
      setCount(n);
    };

    compute();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("known:")) compute();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return count;
};

const KnownBadge = () => {
  const knownCount = useKnownCount();

  return (<>
    {knownCount > 0 && (
      <div className="px-2 text-xs font-extrabold text-green-500 bg-opacity-75 border rounded-lg border-green-500/50 bg-background">
        ✓ {knownCount} known
      </div>
    )}

  </>)
}

export const ItemCountBadge = () => {
  const result = useKanjiSearchResult();

  if (result.data?.length == null || result.data.length === 0) {
    return null;
  }
  return (
    <div className="absolute top-[44px] flex gap-1">
      <div className="px-2 text-xs font-extrabold bg-opacity-75 border rounded-lg bg-background">
        {result.data.length} items match your search filters
      </div>
      <KnownBadge />
    </div>
  );
};
