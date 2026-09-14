/** Runtime essays at `/md/kanji-essays/<kanji>-<keyword>.md`. */
const KANJI_ESSAYS_BASE = "/md/kanji-essays";

export const essayKeywordSlug = (keyword: string) =>
  keyword
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getKanjiEssayUrl = (
  kanji: string,
  keyword: string
): string | null => {
  const slug = essayKeywordSlug(keyword);
  if (kanji.length === 0 || slug.length === 0) {
    return null;
  }
  return `${KANJI_ESSAYS_BASE}/${encodeURIComponent(kanji)}-${slug}.md`;
};
