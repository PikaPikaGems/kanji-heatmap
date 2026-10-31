import assetsPaths from "@/lib/assets-paths";
import { isAiSpeaking, stopAiSpeech } from "@/lib/ai-voice/engine";
import {
  addChimeLogEntry,
  type ChimeLogEntry,
  type ChimeOutcome,
} from "@/lib/chime-log";

/**
 * The chime after a correct answer, shared by every game, with a log of the
 * last few chimes for App & Device Info.
 *
 * - A few <audio> elements are made when a game's code loads and kept for the
 *   page's life; each chime takes one that isn't playing, so a playing one is
 *   never rewound (Safari often stays silent after that).
 * - Speech still going when the answer is right (the sentence read aloud when
 *   the card appeared, or after a miss) is stopped first. On iPhone the
 *   browser voice holds the audio and the chime that starts under it is often
 *   swallowed; the answer is in, so that speech is done anyway.
 * - Every chime is logged: what was speaking, and whether it played, was
 *   blocked, was cut off, or never started. iPhone fails silently, so this is
 *   how a missing chime can be told apart from the rest.
 */
const POOL_SIZE = 3;
/** Longer than the file (1.8 s), so a played chime has ended by then. */
const SETTLE_MS = 2500;

const makeChime = () => {
  const audio = new Audio(assetsPaths.SPEED_KATAKANA_CORRECT_SOUND);
  audio.preload = "auto";
  return audio;
};

// Module-level: made once, when a game's code loads, so the file is ready
// before the first answer. Not in a browser (tests), there is nothing to play.
const pool: HTMLAudioElement[] =
  typeof Audio === "undefined"
    ? []
    : Array.from({ length: POOL_SIZE }, makeChime);
let nextSlot = 0;

const audioSessionType = () =>
  (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    ?.type;

/** Stops speech still going, and says which one it was. */
const stopSpeech = (): ChimeLogEntry["speech"] => {
  if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
    window.speechSynthesis.cancel();
    return "browser voice";
  }
  if (isAiSpeaking()) {
    stopAiSpeech();
    return "AI voice";
  }
  return "none";
};

/**
 * Plays `audio` from the start and records how it went on `entry`: ended
 * (played), paused before the end (cut off), still at 0 after the file's
 * length (never started), or a rejected play() (blocked).
 */
const playAndWatch = (
  audio: HTMLAudioElement,
  entry: ChimeLogEntry,
  onBlocked: () => void
) => {
  const done = new AbortController();
  const settle = (outcome: ChimeOutcome) => {
    if (entry.outcome.kind !== "pending") return;
    entry.outcome = outcome;
    done.abort();
  };
  audio.addEventListener("ended", () => settle({ kind: "played" }), {
    signal: done.signal,
  });
  audio.addEventListener(
    "pause",
    () => {
      if (!audio.ended)
        settle({ kind: "cut-off", atMs: Math.round(audio.currentTime * 1000) });
    },
    { signal: done.signal }
  );
  window.setTimeout(() => {
    settle(
      audio.currentTime === 0 ? { kind: "never-started" } : { kind: "played" }
    );
  }, SETTLE_MS);

  try {
    audio.currentTime = 0;
  } catch {
    // Not seekable yet (still loading): it plays from the start anyway.
  }
  audio.play().catch((err: unknown) => {
    settle({
      kind: "blocked",
      error: err instanceof Error ? err.name : String(err),
    });
    onBlocked();
  });
};

export const playCorrectChime = () => {
  if (pool.length === 0) return;
  const speech = stopSpeech();
  // Prefer an idle element, so a playing one is never rewound.
  const idle = pool.findIndex((audio) => audio.paused || audio.ended);
  const slot = idle === -1 ? nextSlot : idle;
  nextSlot = (slot + 1) % pool.length;

  const entry: ChimeLogEntry = {
    at: new Date(),
    speech,
    slot,
    outcome: { kind: "pending" },
    audioSession: audioSessionType(),
  };
  addChimeLogEntry(entry);
  playAndWatch(pool[slot], entry, () => {
    // The element may be stuck (e.g. its load was interrupted): replace it so
    // the next chime gets a fresh one, and try once more with it.
    const fresh = makeChime();
    pool[slot] = fresh;
    const retry: ChimeLogEntry = { ...entry, slot: "retry" };
    retry.outcome = { kind: "pending" };
    addChimeLogEntry(retry);
    playAndWatch(fresh, retry, () => {
      // Still blocked (autoplay rules, no audio device): stay silent.
    });
  });
};
