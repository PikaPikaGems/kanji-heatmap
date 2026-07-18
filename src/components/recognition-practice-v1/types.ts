import type {
  DeckFilterSettings,
  PracticeItem as SharedPracticeItem,
} from "@/components/shared-practice";

export type SoundMode = "correct" | "speak";

export type RecognitionPracticeSettings = DeckFilterSettings & {
  sound: { enabled: true; type: SoundMode } | { enabled: false };
};

export type PracticeItem = SharedPracticeItem;

export type SessionResult = PracticeItem & {
  correct: boolean;
};
