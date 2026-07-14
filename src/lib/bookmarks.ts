/** Bookmark localStorage key for an anchor word of a kanji. */
export const bookmarkStorageKey = (kanji: string, word: string) =>
  `b:${kanji}:${word}`;

export const isBookmarked = (kanji: string, word: string) =>
  localStorage.getItem(bookmarkStorageKey(kanji, word)) === "true";

export const BOOKMARK_KEY_PREFIX = "b:";
