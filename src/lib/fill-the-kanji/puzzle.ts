import { decodeFurigana, WordPartDetail } from "@/lib/furigana";
import { isKanji, shuffle } from "@/lib/utils";

/**
 * Most distinct kanji blanked in one sentence. With 8 tiles this leaves at
 * least 2 lookalike distractors; any other kanji in the sentence stay visible.
 */
export const MAX_BLANK_KANJI = 6;

/** Choices of how many tiles are offered per sentence. */
export const TILE_COUNT_OPTIONS = [8, 12] as const;

export type TileCount = (typeof TILE_COUNT_OPTIONS)[number];

export const DEFAULT_TILE_COUNT: TileCount = 8;

export const isTileCount = (v: unknown): v is TileCount =>
  TILE_COUNT_OPTIONS.some((n) => n === v);

/**
 * Keyboard shortcut per tile, in tile order. With 12 tiles the digits run
 * 1-0, then q and w from the keyboard's top letter row.
 */
export const tileShortcutKeys = (tileCount: number): string[] =>
  (tileCount === 12 ? "1234567890qw" : "12345678").split("");

/** One character of the sentence; `blank` indexes `Puzzle.blanks` when hidden. */
export type PuzzleChar = { char: string; blank: number | null };

/** One furigana segment, split into characters for rendering blanks. */
export type PuzzleSegment = {
  reading: string | undefined;
  chars: PuzzleChar[];
};

export type Puzzle = {
  /** Bunsetsu (the space-separated chunks in the data), each a list of segments. */
  bunsetsu: PuzzleSegment[][];
  /** Correct kanji per blank, in reading order. */
  blanks: string[];
  /** Distinct blanked kanji (each tile can fill several blanks). */
  answers: string[];
  /** Every kanji in the sentence, blanked or not. */
  sentenceKanji: string[];
};

export const parseSentence = (jp: string): WordPartDetail[] =>
  decodeFurigana(jp);

/**
 * The sentence split at its spaces, which mark bunsetsu boundaries in the
 * data ("電車[でんしゃ]で 行[い]くしか ないです"), each chunk decoded.
 */
export const parseBunsetsu = (jp: string): WordPartDetail[][] =>
  jp
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => decodeFurigana(chunk));

/** The sentence without readings or spacing, e.g. for text-to-speech. */
export const plainSentence = (jp: string): string =>
  parseSentence(jp)
    .map(([text]) => text)
    .join("");

/**
 * Picks which kanji to blank. Sentences with more than MAX_BLANK_KANJI
 * distinct kanji get a random subset; every occurrence of a picked kanji is
 * blanked, so one tile can fill repeats (食べられるだけ食べて).
 */
export const buildPuzzle = (jp: string): Puzzle => {
  const chunks = parseBunsetsu(jp);
  const sentenceKanji = [
    ...new Set(
      chunks.flat().flatMap(([text]) => Array.from(text).filter(isKanji))
    ),
  ];
  const answers =
    sentenceKanji.length <= MAX_BLANK_KANJI
      ? sentenceKanji
      : shuffle(sentenceKanji).slice(0, MAX_BLANK_KANJI);
  const answerSet = new Set(answers);

  const blanks: string[] = [];
  const bunsetsu = chunks.map((parts) =>
    parts.map(([text, reading]) => ({
      reading,
      chars: Array.from(text).map((char) => {
        if (!answerSet.has(char)) return { char, blank: null };
        blanks.push(char);
        return { char, blank: blanks.length - 1 };
      }),
    }))
  );

  return {
    bunsetsu,
    blanks,
    answers: sentenceKanji.filter((k) => answerSet.has(k)),
    sentenceKanji,
  };
};

/**
 * `tileCount` shuffled tiles: the answers plus lookalike distractors.
 *
 * Distractor order: each answer's similar kanji, most similar first (the
 * similar-kanji lists are ordered that way), taken round-robin so every
 * answer gets its closest lookalike; then similars of those similars, in the
 * same order; then `fallbackPool` (kanji from the rest of the round) for
 * kanji with no similars listed. Kanji already in the sentence are never
 * distractors. Only the fallback pool and the final tile order are random.
 */
export const buildTiles = ({
  answers,
  sentenceKanji,
  getSimilars,
  fallbackPool,
  tileCount,
}: {
  answers: string[];
  sentenceKanji: string[];
  getSimilars: (kanji: string) => string[];
  fallbackPool: string[];
  tileCount: TileCount;
}): string[] => {
  const needed = tileCount - answers.length;
  const used = new Set(sentenceKanji);
  const distractors: string[] = [];

  const take = (candidates: string[]) => {
    for (const k of candidates) {
      if (distractors.length >= needed) return;
      if (!isKanji(k) || used.has(k)) continue;
      used.add(k);
      distractors.push(k);
    }
  };

  // Rank 1 of every list, then rank 2 of every list, and so on.
  const takeRoundRobin = (lists: string[][]) => {
    const longest = Math.max(0, ...lists.map((list) => list.length));
    for (let i = 0; i < longest; i++) {
      take(lists.map((list) => list[i]).filter((k) => k != null));
    }
  };

  const firstDegree = answers.map(getSimilars);
  takeRoundRobin(firstDegree);
  takeRoundRobin(firstDegree.map((list) => list.flatMap(getSimilars)));
  take(shuffle(fallbackPool));

  return shuffle([...answers, ...distractors]);
};
