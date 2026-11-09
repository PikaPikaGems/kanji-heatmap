import type { AiProvider } from "./types";

/** A voice a picker offers: its id and the name shown. */
export type AiVoiceOption = { id: string; name: string };

const named = (ids: string[]): AiVoiceOption[] =>
  ids.map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1) }));

/**
 * Voices of the providers whose voice list is fixed. ElevenLabs voices come
 * from its Voice Library instead (see elevenlabs.ts).
 */
export const FIXED_VOICES: Partial<Record<AiProvider, AiVoiceOption[]>> = {
  xai: named(["ara", "eve", "rex", "sal", "leo"]),
};

/** The voice used until another is picked. */
export const DEFAULT_VOICES: Partial<Record<AiProvider, string>> = {
  xai: "ara",
};

export const voiceName = (provider: AiProvider, id: string) =>
  FIXED_VOICES[provider]?.find((voice) => voice.id === id)?.name ?? id;
