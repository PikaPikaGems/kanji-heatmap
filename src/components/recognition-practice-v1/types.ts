import type { PracticeItem as SharedPracticeItem } from "@/components/shared-practice";
import { JLTPTtypes } from "@/lib/jlpt";

export type SoundMode = "correct" | "speak";

export type RecognitionPracticeSettings = {
  jlpt: JLTPTtypes[];
  bookmarkedOnly: boolean;
  randomizeOrder: boolean;
  randomizeFont: boolean;
  sound: { enabled: true; type: SoundMode } | { enabled: false };
};

export type PracticeItem = SharedPracticeItem;

export type SessionResult = PracticeItem & {
  correct: boolean;
};

export type Phase = "initial" | "playing" | "ended";
