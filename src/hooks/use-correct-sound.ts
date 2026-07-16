import { useCallback, useRef } from "react";
import assetsPaths from "@/lib/assets-paths";

/**
 * Returns a `play` function for the on-correct feedback used by the practice
 * modes. It owns the lazily-created <audio> element and the speak/beep choice:
 * pass a `speak` callback to speak instead of playing the beep. Callers supply
 * their own `enabled` flag (settings differ per mode).
 */
export const useCorrectSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return useCallback(
    ({ enabled, speak }: { enabled: boolean; speak?: () => void }) => {
      if (!enabled) return;
      if (speak) {
        speak();
        return;
      }
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(
            assetsPaths.SPEED_KATAKANA_CORRECT_SOUND
          );
        }
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
      } catch {
        // ignore playback failures
      }
    },
    []
  );
};
