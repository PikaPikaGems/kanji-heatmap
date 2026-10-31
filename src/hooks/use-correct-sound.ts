import { playCorrectChime } from "@/lib/correct-chime";

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
  playCorrectChime();
};

/**
 * Returns a `play` function for the on-correct feedback used by the practice
 * modes: pass a `speak` callback to speak instead of playing the chime (see
 * `correct-chime.ts`). Callers supply their own `enabled` flag (settings
 * differ per mode).
 */
export const useCorrectSound = () => playCorrect;
