import { useEffect, useState } from "react";
import { BOOKMARK_KEY_PREFIX } from "@/lib/bookmarks";

/** Parse `b:{kanji}:{word}` → kanji character, or null if malformed. */
export const kanjiFromBookmarkKey = (key: string): string | null => {
  if (!key.startsWith(BOOKMARK_KEY_PREFIX)) return null;
  const rest = key.slice(BOOKMARK_KEY_PREFIX.length);
  const colon = rest.indexOf(":");
  if (colon <= 0) return null;
  return rest.slice(0, colon);
};

const readBookmarkedKanji = (): string[] => {
  const kanji: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(BOOKMARK_KEY_PREFIX)) continue;
    if (localStorage.getItem(key) !== "true") continue;
    const k = kanjiFromBookmarkKey(key);
    if (k) kanji.push(k);
  }
  return kanji;
};

/** Reactive list of bookmarked kanji (1:1 with representative words). */
export const useBookmarkedKanji = () => {
  const [kanji, setKanji] = useState<string[]>(() => readBookmarkedKanji());

  useEffect(() => {
    const refresh = () => setKanji(readBookmarkedKanji());
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(BOOKMARK_KEY_PREFIX) || e.key == null) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return kanji;
};
