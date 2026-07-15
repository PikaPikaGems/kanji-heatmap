import { BOOKMARK_KEY_PREFIX } from "@/lib/bookmarks";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { isKanji } from "@/lib/utils";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { useState, useEffect } from "react";
import { KANJI_COUNT } from "@/lib/options/constants";

const useKnownCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const compute = () => {
      let n = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key?.startsWith(BOOKMARK_KEY_PREFIX) &&
          localStorage.getItem(key) === "true"
        )
          n++;
      }
      setCount(n);
    };

    compute();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(BOOKMARK_KEY_PREFIX)) compute();
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
        ✓ {knownCount} Bookmarked
      </div>
    )}

  </>)
}

const ItemsCountLayout = ({ count }: { count: number }) => {
  return <>
    <div className="absolute top-[50px] flex flex-wrap gap-1">
      <div className="px-2 text-xs font-extrabold bg-opacity-75 border rounded-lg bg-background">
        {count} {count !== 1 ? "Items" : "Item"} {KANJI_COUNT !== count ? "Matched" : ""}
      </div>
      <KnownBadge />
    </div>

  </>
}

export const ItemCountBadge = () => {
  const result = useKanjiSearchResult();
  const searchSettings = useSearchSettings();
  const { type, text } = searchSettings.textSearch;
  const kanjiChars = [...new Set(text.split("").filter(isKanji))];

  if (result.data?.length == null) {
    return <KnownBadge />
  }

  if (type === "multi-kanji" && kanjiChars.length > 0) {
    return <ItemsCountLayout count={kanjiChars.length} />
  }

  return <ItemsCountLayout count={result.data.length} />
};
