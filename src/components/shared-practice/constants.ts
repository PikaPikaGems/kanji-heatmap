import { JLPT_TYPE_ARR, JLTPTtypes } from "@/lib/jlpt";
import { JOUYOU_GRADE_TYPE_ARR, JouyouGradeType } from "@/lib/jouyou-grade";
import { DeckFilterSettings } from "./types";

/** Words per practice session chunk (both practice modes). */
export const PRACTICE_SESSION_SIZE = 10;

/** Deck-filter defaults shared by every practice mode's settings object. */
export const DEFAULT_DECK_FILTER_SETTINGS: DeckFilterSettings = {
  jlpt: [...JLPT_TYPE_ARR] as JLTPTtypes[],
  jouyouGrade: [...JOUYOU_GRADE_TYPE_ARR] as JouyouGradeType[],
  bookmarkedOnly: false,
  randomizeOrder: true,
  randomizeFont: false,
};
