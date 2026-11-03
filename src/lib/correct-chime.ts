import assetsPaths from "@/lib/assets-paths";
import { isAiSpeaking } from "@/lib/ai-voice/engine";
import {
  addChimeLogEntry,
  type ChimeLogEntry,
  type ChimeOutcome,
} from "@/lib/chime-log";

/**
 * The chime after a correct answer, shared by every game, with a log of the
 * last few chimes for App & Device Info (`chime-log.ts`).
 *
 * Every chime is a brand-new <audio> element. On iPhone (Safari and the
 * home-screen app) replaying the same element again and again works a few
 * times, then now and then plays nothing mid-round, with no error. A new
 * element each time has no leftover state to trip over. It plays from a copy
 * of the file kept in memory (fetched once, when a game's code loads), so it
 * starts at once, needs no network and works offline. Like before, it plays
 * with the ring/silent switch on silent.
 *
 * iPhone fails silently, so every chime is logged: whether it played, was
 * blocked, was cut off, or never started, and whether any speech was
 * playing. A missing chime logged as "played" means iPhone played it
 * silently.
 */

/** Longer than the file (1.8 s), so a played chime has ended by then. */
const SETTLE_MS = 2500;

const FILE_URL = assetsPaths.SPEED_KATAKANA_CORRECT_SOUND;

// Module-level: the file is fetched once, when a game's code loads, and kept
// as an in-memory URL. Until then (or if the fetch fails) chimes use the
// file's own URL. Not in a browser (tests), there is nothing to fetch.
let chimeUrl = FILE_URL;
if (typeof window !== "undefined" && typeof fetch === "function") {
  fetch(FILE_URL)
    .then((response) => (response.ok ? response.blob() : null))
    .then((blob) => {
      if (blob) chimeUrl = URL.createObjectURL(blob);
    })
    .catch(() => {
      // Offline before the first chime: the file's URL still works online.
    });
}

// Elements still playing, so none is garbage-collected mid-chime.
const playing = new Set<HTMLAudioElement>();

const audioSessionType = () =>
  (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    ?.type;

/** Which speech, if any, is playing (only recorded, never stopped). */
const currentSpeech = (): ChimeLogEntry["speech"] => {
  if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
    return "browser voice";
  }
  if (isAiSpeaking()) return "AI voice";
  return "none";
};

/**
 * Plays a new element and records how it went on `entry`: ended (played),
 * paused before the end (cut off), still at 0 after the file's length (never
 * started), or a rejected play() (blocked).
 */
const playOnce = (entry: ChimeLogEntry, onBlocked: () => void) => {
  const audio = new Audio(chimeUrl);
  playing.add(audio);
  const done = new AbortController();
  const settle = (outcome: ChimeOutcome) => {
    if (entry.outcome.kind !== "pending") return;
    entry.outcome = outcome;
    done.abort();
    playing.delete(audio);
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

  audio.play().catch((err: unknown) => {
    settle({
      kind: "blocked",
      error: err instanceof Error ? err.name : String(err),
    });
    onBlocked();
  });
};

export const playCorrectChime = () => {
  if (typeof Audio === "undefined") return;
  const entry: ChimeLogEntry = {
    at: new Date(),
    speech: currentSpeech(),
    attempt: "first",
    outcome: { kind: "pending" },
    audioSession: audioSessionType(),
  };
  addChimeLogEntry(entry);
  playOnce(entry, () => {
    // Refused (e.g. the element couldn't load): try once more.
    const retry: ChimeLogEntry = {
      ...entry,
      attempt: "retry",
      outcome: { kind: "pending" },
    };
    addChimeLogEntry(retry);
    playOnce(retry, () => {
      // Still blocked (autoplay rules, no audio device): stay silent.
    });
  });
};
