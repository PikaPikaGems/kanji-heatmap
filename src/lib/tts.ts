/** Reusable disclaimer for any text-to-speech feature — not every device/browser ships Japanese TTS voices. */
export const TTS_DISCLAIMER =
  "⚠️ text-to-speech might not work on all devices.";

export const DEFAULT_JP_VOICE_ID = "default";

export type JpVoiceOption = {
  id: string;
  label: string;
  match: (voice: SpeechSynthesisVoice) => boolean;
};

/** The 6 most commonly available built-in Japanese TTS voices across Chrome, macOS/iOS, and Windows/Edge. */
export const JP_VOICE_OPTIONS: JpVoiceOption[] = [
  {
    id: "google",
    label: "Google 日本語",
    match: (v) => v.name.includes("Google 日本語"),
  },
  {
    id: "kyoko",
    label: "Kyoko (Apple)",
    match: (v) => v.name.includes("Kyoko"),
  },
  {
    id: "otoya",
    label: "Otoya (Apple)",
    match: (v) => v.name.includes("Otoya"),
  },
  {
    id: "nanami",
    label: "Microsoft Nanami",
    match: (v) => v.name.includes("Nanami"),
  },
  {
    id: "keita",
    label: "Microsoft Keita",
    match: (v) => v.name.includes("Keita"),
  },
  {
    id: "haruka",
    label: "Microsoft Haruka",
    match: (v) => v.name.includes("Haruka"),
  },
];

/**
 * Resolves the actual voice to speak with: the user's preferred voice if
 * present on this device, otherwise the first available Japanese voice
 * ("Default" behavior).
 */
export const resolveJpVoice = (
  voices: SpeechSynthesisVoice[],
  voiceId: string
): SpeechSynthesisVoice | null => {
  const jaVoices = voices.filter((v) => v.lang === "ja-JP");

  const option = JP_VOICE_OPTIONS.find((o) => o.id === voiceId);
  const preferred = option && jaVoices.find(option.match);
  if (preferred) return preferred;

  return jaVoices[0] || null;
};
