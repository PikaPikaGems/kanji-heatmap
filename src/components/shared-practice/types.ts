import { JLTPTtypes } from "@/lib/jlpt";
import { JouyouGradeType } from "@/lib/jouyou-grade";

/** Shared deck item used by recognition + production practice. */
export type PracticeItem = {
  kanji: string;
  word: string;
  reading: string;
  englishGloss: string;
  keyword: string;
  fontIndex: number | null;
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
