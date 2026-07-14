import { JLTPTtypes } from "@/lib/jlpt";

export type SoundMode = "correct" | "speak";

export type RecognitionPracticeSettings = {
  jlpt: JLTPTtypes[];
  bookmarkedOnly: boolean;
  randomizeOrder: boolean;
  randomizeFont: boolean;
  blurEnglishGloss: boolean;
  sound: { enabled: true; type: SoundMode } | { enabled: false };
};

export type PracticeItem = {
  kanji: string;
  word: string;
  reading: string;
  englishGloss: string;
  keyword: string;
  fontIndex: number | null;
};

export type SessionResult = PracticeItem & {
  correct: boolean;
};

export type Phase = "initial" | "playing" | "ended";
