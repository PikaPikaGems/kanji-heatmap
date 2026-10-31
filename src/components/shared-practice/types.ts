import type { FsrsRating } from "engine-contract";
import { JLTPTtypes } from "@/lib/jlpt";
import { JouyouGradeType } from "@/lib/jouyou-grade";

/** A word a card shows; `reading` is its readings joined with "・". */
export type PracticeWord = {
  word: string;
  reading: string;
  englishGloss: string;
};

/** Shared deck item used by recognition + production practice. */
export type PracticeItem = PracticeWord & {
  kanji: string;
  keyword: string;
  fontIndex: number | null;
  /**
   * The kanji's secondary anchor word, shown next to the main word by the
   * writing games. Reading games drill one word and leave it out.
   */
  secondary?: PracticeWord;
};

/** Minimal result shape for the shared end-session screen. */
export type PracticeSessionResult = {
  kanji: string;
  word: string;
  keyword: string;
  correct: boolean;
};

/** Settings fields needed to build a representative-word deck. */
export type DeckFilterSettings = {
  jlpt: JLTPTtypes[];
  jouyouGrade: JouyouGradeType[];
  bookmarkedOnly: boolean;
  randomizeOrder: boolean;
  randomizeFont: boolean;
};

/**
 * Review wiring for a practice card UI used as a mastery game
 * (/reading-mastery, /writing-mastery). Plain practice omits it.
 */
export type MasteryGrading = {
  /** Frozen next-review interval per rating, e.g. `{ good: "5d" }`. */
  intervals: Record<FsrsRating, string>;
  /** Called once per card with the rating the user ended up giving. */
  onGrade: (rating: FsrsRating) => void;
};
