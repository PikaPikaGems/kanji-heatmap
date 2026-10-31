import type { Stroke } from "@/lib/stroke-types";
import type {
  DeckFilterSettings,
  PracticeItem as SharedPracticeItem,
  SoundSetting,
} from "@/components/shared-practice";

export type ProductionPracticeSettings = DeckFilterSettings & {
  hearPronunciationOnLoad: boolean;
  /** Sound after answering. Optional: older saved settings lack it. */
  sound?: SoundSetting;
  /** Older saved settings' on/off chime, read when `sound` is missing. */
  celebratorySoundOnCorrect?: boolean;
};

export type PracticeItem = SharedPracticeItem;

export type SessionResult = PracticeItem & {
  correct: boolean;
  gradeRank: number;
};

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
