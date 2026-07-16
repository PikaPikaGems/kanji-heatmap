import type { Stroke } from "@/components/dependent/DrawingPad";
import type {
  DeckFilterSettings,
  PracticeItem as SharedPracticeItem,
} from "@/components/shared-practice";

export type ProductionPracticeSettings = DeckFilterSettings & {
  blurEnglishGloss: boolean;
  hearPronunciationOnLoad: boolean;
  celebratorySoundOnCorrect: boolean;
};

export type PracticeItem = SharedPracticeItem;

export type SessionResult = PracticeItem & {
  correct: boolean;
  gradeRank: number;
};

export type Phase = "initial" | "loading" | "playing" | "ended";

export type GradeRankInfo = {
  rank: number;
  topGuess: string | null;
  inTop10: boolean;
};

export type DrawingSnapshot = {
  strokes: Stroke[];
  width: number;
  height: number;
};
