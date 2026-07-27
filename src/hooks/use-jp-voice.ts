import { useCallback } from "react";
import { notifyStorage } from "@/lib/storage";
import { DEFAULT_JP_VOICE_ID } from "@/lib/tts";
import { useStorageValue } from "./use-storage-value";

const LOCAL_STORAGE_JP_VOICE_KEY = "jp-voice-id";

const readVoiceId = () =>
  localStorage.getItem(LOCAL_STORAGE_JP_VOICE_KEY) || DEFAULT_JP_VOICE_ID;

/**
 * Reactive current Japanese TTS voice preference (an id from
 * JP_VOICE_OPTIONS, or DEFAULT_JP_VOICE_ID) + a setter. Stays in sync across
 * every hook instance and browser tabs via the same storage-event plumbing
 * as useLocalStorageFlag.
 */
export const useCurrentJpVoice = () => {
  const voiceId = useStorageValue(
    readVoiceId,
    (key) => key === LOCAL_STORAGE_JP_VOICE_KEY
  );

  const setVoiceId = useCallback((next: string) => {
    localStorage.setItem(LOCAL_STORAGE_JP_VOICE_KEY, next);
    notifyStorage(LOCAL_STORAGE_JP_VOICE_KEY);
  }, []);

  return [voiceId, setVoiceId] as [string, (next: string) => void];
};
