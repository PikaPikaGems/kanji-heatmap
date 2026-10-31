/** How sound plays after a correct answer: a chime, or the answer spoken. */
export type SoundMode = "correct" | "speak";

/** The games' saved sound setting. */
export type SoundSetting =
  | { enabled: true; type: SoundMode }
  | { enabled: false };

/** The default: a chime when you're right. */
export const CHIME_SOUND: SoundSetting = { enabled: true, type: "correct" };
