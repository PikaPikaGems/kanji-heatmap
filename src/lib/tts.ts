/** Reusable disclaimer for any text-to-speech feature — not every device/browser ships Japanese TTS voices. */
export const TTS_DISCLAIMER =
  "⚠️ text-to-speech might not work on all devices.";

export const DEFAULT_JP_VOICE_ID = "default";

/** Japanese voices currently installed in this browser. */
export const listJpVoices = (
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice[] => voices.filter((v) => v.lang.startsWith("ja"));

/**
 * Finds a preferred Japanese voice without falling back. Preference ids are
 * `SpeechSynthesisVoice.voiceURI` values. Legacy short ids from an older
 * hardcoded list (e.g. "kyoko") are still matched by name.
 */
export const findJpVoice = (
  voices: SpeechSynthesisVoice[],
  voiceId: string
): SpeechSynthesisVoice | null => {
  if (voiceId === DEFAULT_JP_VOICE_ID) return null;

  const jaVoices = listJpVoices(voices);
  return (
    jaVoices.find(
      (v) =>
        v.voiceURI === voiceId ||
        v.name === voiceId ||
        v.name.toLowerCase().includes(voiceId.toLowerCase())
    ) || null
  );
};

/**
 * Resolves the actual voice to speak with: the user's preferred voice if
 * present on this device, otherwise the first available Japanese voice
 * ("Default" behavior).
 */
export const resolveJpVoice = (
  voices: SpeechSynthesisVoice[],
  voiceId: string
): SpeechSynthesisVoice | null => {
  const jaVoices = listJpVoices(voices);
  if (jaVoices.length === 0) return null;

  return findJpVoice(voices, voiceId) || jaVoices[0];
};
