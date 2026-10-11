import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  getAiVoiceState,
  keepAiVoiceWarm,
  loadYomiage,
  startAiVoiceIfCached,
  subscribeAiVoice,
} from "@/lib/ai-voice/engine";
import {
  AI_VOICE_SETTINGS_KEY,
  readAiVoiceSettings,
  readVoiceEngine,
  VOICE_ENGINE_KEY,
  writeAiVoiceSettings,
  writeVoiceEngine,
  type AiVoiceSettings,
  type VoiceEngine,
} from "@/lib/ai-voice/preferences";
import { useStorageValue } from "./use-storage-value";

/** Reactive engine preference ("browser" by default) + setter. */
export const useVoiceEngine = () => {
  const engine = useStorageValue(
    readVoiceEngine,
    (key) => key === null || key === VOICE_ENGINE_KEY
  );
  return [engine, writeVoiceEngine] as [
    VoiceEngine,
    (next: VoiceEngine) => void,
  ];
};

/** Reactive AI voice settings + a setter that merges a partial update. */
export const useAiVoiceSettings = () => {
  const settings = useStorageValue(
    readAiVoiceSettings,
    (key) => key === null || key === AI_VOICE_SETTINGS_KEY
  );
  const update = useCallback((patch: Partial<AiVoiceSettings>) => {
    const next = { ...readAiVoiceSettings(), ...patch };
    writeAiVoiceSettings(next);
    return next;
  }, []);
  return [settings, update] as const;
};

/** Live status of the shared AI voice. */
export const useAiVoiceState = () =>
  useSyncExternalStore(subscribeAiVoice, getAiVoiceState);

/** The yomiage module (PRESETS, RANGES, DEFAULTS, CREDIT) once loaded, else null. */
export const useYomiageModule = () => {
  const [mod, setMod] = useState<Awaited<ReturnType<typeof loadYomiage>>>(null);

  // Effect needed: lazy dynamic import, so people who never open the AI
  // voice settings never download yomiage.
  useEffect(() => {
    let cancelled = false;
    void loadYomiage().then((m) => {
      if (!cancelled) setMod(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return mod;
};

/**
 * App start: if AI Voice Mode is on and the files are on this device, start
 * the engine so the first speak isn't slow. Never downloads.
 */
export const useAiVoiceStartup = () => {
  // Effect needed: one-time engine start after mount, off the critical path.
  useEffect(() => {
    if (readVoiceEngine() !== "ai") return;
    const id = window.setTimeout(() => void startAiVoiceIfCached(), 1000);
    return () => window.clearTimeout(id);
  }, []);
};

/**
 * Game screens: keep the AI voice in memory for as long as the screen is
 * open, so words after a pause don't wait for a reload.
 */
export const useKeepAiVoiceWarm = () => {
  const [engine] = useVoiceEngine();

  // Effect needed: holds the engine for this screen's lifetime.
  useEffect(() => {
    if (engine !== "ai") return;
    return keepAiVoiceWarm();
  }, [engine]);
};
