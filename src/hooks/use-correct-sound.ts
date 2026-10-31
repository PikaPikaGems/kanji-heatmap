import assetsPaths from "@/lib/assets-paths";

/**
 * The chime after a correct answer, shared by every game.
 *
 * It used to be one <audio> per game, made on the first correct answer. That
 * missed chimes in three ways:
 * - The first correct answer had to download and decode the file before it
 *   could play, so it came late or not at all (phones especially). Mastery
 *   games remount for every card, so that was every answer there.
 * - A quick second correct answer rewound the chime while it was still
 *   playing. Safari often stays silent after a seek on a playing element.
 * - A failed play() was ignored, so the element stayed broken.
 *
 * Now a few elements are made and loaded when a game module loads, kept for
 * the page's life, and each chime takes one that isn't playing.
 */
const POOL_SIZE = 3;

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

const playChime = () => {
  if (pool.length === 0) return;
  // Prefer an idle element, so a playing one is never rewound.
  const idle = pool.findIndex((audio) => audio.paused || audio.ended);
  const slot = idle === -1 ? nextSlot : idle;
  nextSlot = (slot + 1) % pool.length;
  const audio = pool[slot];
  try {
    audio.currentTime = 0;
  } catch {
    // Not seekable yet (still loading): it plays from the start anyway.
  }
  audio.play().catch(() => {
    // The element may be stuck (e.g. its load was interrupted); replace it so
    // the next chime gets a fresh one, and try once more with it.
    const fresh = makeChime();
    pool[slot] = fresh;
    fresh.play().catch(() => {
      // Still blocked (autoplay rules, no audio device): stay silent.
    });
  });
};

const playCorrect = ({
  enabled,
  speak,
}: {
  enabled: boolean;
  speak?: () => void;
}) => {
  if (!enabled) return;
  if (speak) {
    speak();
    return;
  }
  playChime();
};

/**
 * Returns a `play` function for the on-correct feedback used by the practice
 * modes: pass a `speak` callback to speak instead of playing the chime.
 * Callers supply their own `enabled` flag (settings differ per mode).
 */
export const useCorrectSound = () => playCorrect;
