export type KatakanaWord = [katakana: string, englishGloss: string];

export type ChallengeSetData = {
  data: KatakanaWord[];
};

/** How sound is played during a session, when sound is enabled. */
export type SoundMode = "correct" | "speak";

/** Number of words played in a single challenge round. */
export type WordCount = 24 | 48;

export type SpeedKatakanaSettings = {
  setNumber: number;
  randomizeFont: boolean;
  randomizeOrder: boolean;
  displayEnglish: boolean;
  wordCount: WordCount;
  soundEnabled: boolean;
  soundMode: SoundMode;
};

export type SessionStats = {
  /** Whole-number percentage, 0–100. */
  accuracy: number;
  /** Correct katakana characters typed per minute. */
  charsPerMinute: number;
};
