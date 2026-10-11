import type { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import type { FillTheKanjiItem } from "@/lib/fill-the-kanji/types";

/** How sound is played on a correct answer, when sound is enabled. */
export type SoundMode = "correct" | "speak";

export type FillTheKanjiSettings = {
  setId: FillTheKanjiSetId;
  /** Last selected round per set, so switching sets keeps your place. */
  roundBySet: Partial<Record<FillTheKanjiSetId, number>>;
  sound: { enabled: true; type: SoundMode } | { enabled: false };
  /** Speak each sentence when its item appears. Optional: older saved settings lack it. */
  readAloudOnShow?: boolean;
};

export type ItemResult = {
  item: FillTheKanjiItem;
  correct: boolean;
};
