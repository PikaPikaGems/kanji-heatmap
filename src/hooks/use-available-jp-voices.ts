import { useEffect, useState } from "react";
import { listJpVoices } from "@/lib/tts";

/**
 * Japanese TTS voices available on this device/browser.
 * Updates when the browser finishes loading its voice list.
 */
export const useAvailableJpVoices = (): SpeechSynthesisVoice[] => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    typeof window === "undefined"
      ? []
      : listJpVoices(window.speechSynthesis.getVoices())
  );

  // Needed: speechSynthesis voices load async via voiceschanged; no
  // render-time API for the final list.
  useEffect(() => {
    const load = () => {
      setVoices(listJpVoices(window.speechSynthesis.getVoices()));
    };

    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
    };
  }, []);

  return voices;
};
