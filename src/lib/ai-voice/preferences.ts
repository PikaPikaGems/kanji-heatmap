import type { PresetName } from "yomiage";
import { notifyStorage, safeReadJson } from "@/lib/storage";

/** Which text-to-speech engine useSpeak() uses. */
export type VoiceEngine = "browser" | "ai";

export const VOICE_ENGINE_KEY = "jp-voice-engine";
export const AI_VOICE_SETTINGS_KEY = "ai-voice-settings";

/** Read by every preset preview and the Test Voice button. */
/** Spoken by "Test Voice" and the speaker button next to "Voice". */
export const VOICE_PREVIEW_TEXT =
  "こんにちは。今日はいい天気ですね！明日も晴れるといいな。また近くの公園を散歩したいな。";

export type AiVoiceShape = {
  pitch: number;
  formant: number;
  breathReduction: number;
};

/**
 * What the user picked in User Preferences. Unset fields mean "yomiage's
 * default", so the defaults stay owned by yomiage. `custom` holds the values
 * for the Custom chip and is kept while a preset is selected, so switching
 * back to Custom restores them.
 */
export type AiVoiceSettings = {
  preset?: PresetName | "custom";
  custom?: AiVoiceShape;
  speed?: number;
  expressiveness?: number;
  rhythmVariation?: number;
};

export const readVoiceEngine = (): VoiceEngine => {
  try {
    return localStorage.getItem(VOICE_ENGINE_KEY) === "ai" ? "ai" : "browser";
  } catch {
    return "browser";
  }
};

export const writeVoiceEngine = (engine: VoiceEngine) => {
  try {
    localStorage.setItem(VOICE_ENGINE_KEY, engine);
  } catch {
    // Storage can throw (e.g. private mode); the choice just isn't saved.
  }
  notifyStorage(VOICE_ENGINE_KEY);
};

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const numberOrUndefined = (v: unknown) => (isFiniteNumber(v) ? v : undefined);

/** Reads the saved settings, dropping anything malformed. */
export const readAiVoiceSettings = (): AiVoiceSettings => {
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_VOICE_SETTINGS_KEY,
    null
  );
  if (!raw || typeof raw !== "object") return {};

  const custom = raw.custom as Record<string, unknown> | undefined;
  return {
    preset:
      typeof raw.preset === "string"
        ? (raw.preset as AiVoiceSettings["preset"])
        : undefined,
    custom:
      custom &&
      isFiniteNumber(custom.pitch) &&
      isFiniteNumber(custom.formant) &&
      isFiniteNumber(custom.breathReduction)
        ? {
            pitch: custom.pitch,
            formant: custom.formant,
            breathReduction: custom.breathReduction,
          }
        : undefined,
    speed: numberOrUndefined(raw.speed),
    expressiveness: numberOrUndefined(raw.expressiveness),
    rhythmVariation: numberOrUndefined(raw.rhythmVariation),
  };
};

export const writeAiVoiceSettings = (settings: AiVoiceSettings) => {
  try {
    localStorage.setItem(AI_VOICE_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can throw (e.g. private mode); the settings just aren't saved.
  }
  notifyStorage(AI_VOICE_SETTINGS_KEY);
};
