/**
 * The app's one yomiage voice (AI Voice Mode), kept outside React so every
 * useSpeak() shares it without a provider.
 *
 * yomiage is experimental, so nothing here may throw into the app: the module
 * is imported lazily (people who never turn AI Voice on never download it),
 * every failure becomes `status: "unavailable"` or `"error"`, and useSpeak()
 * falls back to the browser voice whenever the AI voice can't speak.
 */
import type {
  PresetName,
  Voice,
  VoiceSettings,
  VoiceStatus,
  OtherLanguages,
} from "yomiage";
import {
  deliveryOf,
  readAiVoiceSettings,
  type AiVoiceSettings,
} from "./preferences";

type Yomiage = typeof import("yomiage");

export type AiVoiceState = {
  status: VoiceStatus;
  /** Voice files are on this device. null until checked. */
  cached: boolean | null;
  downloadMB: number | null;
  /** 0 → 1 while downloading or loading, otherwise null. */
  progress: number | null;
  /** Human-readable reason for "error" / "unavailable". */
  error: string | null;
  /** Why the last speak() fell back to the browser voice; null once one plays. */
  speakError: string | null;
};

let state: AiVoiceState = {
  status: "not-loaded",
  cached: null,
  downloadMB: null,
  progress: null,
  error: null,
  speakError: null,
};
const listeners = new Set<() => void>();

const setState = (patch: Partial<AiVoiceState>) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};

/** For useSyncExternalStore. */
export const subscribeAiVoice = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const getAiVoiceState = () => state;

const ERROR_TEXT: Record<string, string> = {
  "unsupported-browser": "This browser can't run the AI voice.",
  unavailable:
    "The AI voice was turned off after it crashed this tab. Retry to try again.",
  "download-failed":
    "Downloading the voice files failed. Check your connection and retry.",
  "checksum-mismatch": "A downloaded voice file was damaged. Please retry.",
  "out-of-memory": "This device ran out of memory loading the AI voice.",
  timeout: "The AI voice took too long to respond.",
  "engine-failed": "The AI voice failed to start.",
  "worker-crashed": "The AI voice crashed.",
  "audio-blocked": "The browser blocked audio. Tap a speak button to allow it.",
};

const describeError = (err: unknown): string => {
  const code = (err as { code?: string } | null)?.code;
  if (code && ERROR_TEXT[code]) return ERROR_TEXT[code];
  return err instanceof Error ? err.message : String(err);
};

let modulePromise: Promise<Yomiage> | null = null;
let voice: Voice | null = null;

/** Loads the yomiage module once. Resolves null if it can't be loaded. */
export const loadYomiage = async (): Promise<Yomiage | null> => {
  modulePromise ??= import("yomiage");
  try {
    return await modulePromise;
  } catch (err) {
    modulePromise = null;
    setState({ status: "unavailable", error: describeError(err) });
    return null;
  }
};

const getVoice = async (): Promise<Voice | null> => {
  if (voice) return voice;
  const mod = await loadYomiage();
  if (!mod || voice) return voice;

  try {
    const v = mod.createVoice();
    v.on("status", (status) => {
      setState({
        status,
        ...(status === "ready" && { cached: true, error: null }),
        ...(status !== "downloading" &&
          status !== "loading" && { progress: null }),
      });
    });
    v.on("progress", ({ fraction }) => setState({ progress: fraction }));
    voice = v;
    setState({ status: v.status });
  } catch (err) {
    setState({ status: "unavailable", error: describeError(err) });
  }
  return voice;
};

/** Creates the voice and checks whether its files are on this device. */
export const initAiVoice = async () => {
  const v = await getVoice();
  if (!v) return;
  try {
    const { cached, downloadMB } = await v.info();
    setState({ cached, downloadMB });
  } catch {
    // Size info is only for display; leave it unknown.
  }
};

/** Download (when needed) and start the engine. Call from a user action. */
export const loadAiVoice = async () => {
  const v = await getVoice();
  if (!v) return;
  try {
    setState({ error: null });
    await v.load();
  } catch (err) {
    setState({ error: describeError(err) });
  }
};

/**
 * Startup / opt-in: start the engine only if the files are already on this
 * device. Never downloads; that needs the user to press Download.
 */
export const startAiVoiceIfCached = async () => {
  await initAiVoice();
  if (state.cached && voice?.status === "not-loaded") await loadAiVoice();
};

/** Clears a recorded crash and loads again. */
export const retryAiVoice = async () => {
  const v = await getVoice();
  if (!v) return;
  v.resetCrashGuard();
  await loadAiVoice();
};

export const deleteAiVoiceFiles = async () => {
  const v = await getVoice();
  if (!v) return;
  try {
    await v.clearCache();
  } catch {
    // Deleting is best effort; the status line shows whatever state results.
  }
  setState({ cached: false, error: null });
};

/** Frees the engine's memory (files stay). Used when switching to the browser voice. */
export const unloadAiVoice = () => {
  voice?.unload();
  restoreAudioSession();
};

/** True when speak() can use the AI voice ("stopped" reloads on its own). */
export const canSpeakAi = () =>
  voice !== null && (voice.status === "ready" || voice.status === "stopped");

/**
 * The memory was freed (idle, or the app went to the background). Speaking
 * now would wait for a reload, which takes seconds on a phone.
 */
export const aiVoiceNeedsReload = () => voice?.status === "stopped";

/** Records why an AI speak fell back to the browser voice (shown in settings). */
export const reportAiSpeakFailure = (reason: string) =>
  setState({ speakError: reason });

export const stopAiSpeech = () => {
  voice?.stop();
};

const definedOnly = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined)
  ) as Partial<T>;

/** Turns the saved preferences into yomiage settings for one call. */
export const toVoiceSettings = (
  settings: AiVoiceSettings,
  presets: Readonly<Record<PresetName, unknown>>
): VoiceSettings => {
  const delivery = definedOnly(deliveryOf(settings));
  if (settings.preset === "custom") {
    return settings.custom ? { ...delivery, ...settings.custom } : delivery;
  }
  // An unknown preset (e.g. renamed in a newer yomiage) falls back to the default.
  return settings.preset && settings.preset in presets
    ? { ...delivery, preset: settings.preset }
    : delivery;
};

/** Speed multiplier for the snail ("say it slowly") buttons. */
export const SLOW_SPEED_FACTOR = 0.7;

type AudioSession = { type: string };
const audioSession = (): AudioSession | undefined =>
  (navigator as Navigator & { audioSession?: AudioSession }).audioSession;

// The session type before the AI voice switched it to "playback".
let typeBeforeAiVoice: string | null = null;

/**
 * iOS mutes Web Audio (which yomiage plays through) when the ring / silent
 * switch is on silent, while the browser voice still plays, so the AI voice
 * seemed silent with no error. "playback" makes it play like a video does
 * (and pauses music in other apps). Set once and kept while AI Voice Mode is
 * on: switching the type back and forth around every speech interrupted
 * Safari's audio, so later speeches failed with no sound at all. Safari
 * 16.4+ only; elsewhere these do nothing.
 */
const preferPlaybackAudio = () => {
  const session = audioSession();
  if (!session || session.type === "playback") return;
  try {
    typeBeforeAiVoice = session.type;
    session.type = "playback";
  } catch {
    // Best effort; sound still plays when the switch is off silent.
  }
};

const restoreAudioSession = () => {
  const session = audioSession();
  if (!session || typeBeforeAiVoice == null) return;
  try {
    session.type = typeBeforeAiVoice;
  } catch {
    // Best effort.
  }
  typeBeforeAiVoice = null;
};

type SpeakAiOptions = {
  settings?: AiVoiceSettings;
  /** Speak slower than the saved speed (snail buttons). */
  slow?: boolean;
  onStart?: () => void;
  otherLanguages?: OtherLanguages;
};

const speakAiNow = async (
  text: string,
  { settings, slow, onStart, otherLanguages }: SpeakAiOptions
): Promise<"done" | "stopped"> => {
  const mod = await loadYomiage();
  if (!mod || !voice) throw new Error("AI voice not loaded");

  const saved = settings ?? readAiVoiceSettings();
  // yomiage clamps speed to its range, so a very slow saved speed stays valid.
  const delivery = deliveryOf(saved);
  // Slow is the chosen delivery, slowed down, so it goes in as Custom.
  const chosen: AiVoiceSettings = slow
    ? {
        ...saved,
        ...delivery,
        deliveryPreset: "custom",
        speed: (delivery.speed ?? mod.DEFAULTS.speed) * SLOW_SPEED_FACTOR,
      }
    : saved;

  let started = false;
  return voice.speak(text, {
    ...toVoiceSettings(chosen, mod.PRESETS),
    ...(otherLanguages && { otherLanguages }),
    onSentence: () => {
      if (started) return;
      started = true;
      onStart?.();
    },
  });
};

/**
 * Speaks with the AI voice. Rejects when it can't (callers fall back to the
 * browser voice). `onStart` fires when audio actually starts playing.
 */
export const speakAi = async (
  text: string,
  options: SpeakAiOptions = {}
): Promise<"done" | "stopped"> => {
  preferPlaybackAudio();
  try {
    const result = await speakAiNow(text, options);
    if (result === "done") setState({ speakError: null });
    return result;
  } catch (err) {
    setState({ speakError: describeError(err) });
    throw err;
  }
};

export const getAiVoiceDebugReport = async (): Promise<string> => {
  const v = await getVoice();
  if (!v) return `Debug report\nyomiage could not be loaded: ${state.error}`;
  return v.debugReport();
};

/**
 * Keeps the engine in memory until the returned function is called, so a
 * game doesn't pay the reload delay after a pause. yomiage combines the
 * policy over all voices on the page and never frees memory while one of
 * them has `idleTimeout: 0`, so this is a second, short-lived voice. Also
 * starts the engine now, so the first word of the game isn't slow. Does
 * nothing unless the files are already on the device (never downloads).
 */
export const keepAiVoiceWarm = (): (() => void) => {
  let released = false;
  let warm: Voice | null = null;

  void (async () => {
    // The app's own voice must be loaded for speak() to use it; the warm
    // voice only holds the shared engine in memory.
    await startAiVoiceIfCached();
    const mod = canSpeakAi() ? await loadYomiage() : null;
    if (!mod || released) return;
    try {
      warm = mod.createVoice({ idleTimeout: 0 });
      await warm.load();
    } catch {
      // Keeping warm is only an optimisation; speak() still reloads on demand.
    }
  })();

  return () => {
    released = true;
    try {
      warm?.dispose();
    } catch {
      // Already gone.
    }
  };
};
