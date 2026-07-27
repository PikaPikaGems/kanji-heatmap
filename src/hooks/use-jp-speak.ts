import { useCallback, useEffect, useRef } from "react";
import { resolveJpVoice } from "@/lib/tts";
import { useCurrentJpVoice } from "./use-jp-voice";

export const useSpeak = (word: string) => {
  const [voiceId] = useCurrentJpVoice();
  const japaneseVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Effect needed: subscribes to speechSynthesis voiceschanged (voices load
  // async in some browsers), and re-resolves when the voice preference changes.
  useEffect(() => {
    const loadVoice = () => {
      japaneseVoiceRef.current = resolveJpVoice(
        window.speechSynthesis.getVoices(),
        voiceId
      );
    };

    loadVoice();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoice);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoice);
    };
  }, [voiceId]);

  const speak = useCallback(() => {
    // Cancel any ongoing speech (Chrome fix)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "ja-JP";

    if (!japaneseVoiceRef.current) {
      japaneseVoiceRef.current = resolveJpVoice(
        window.speechSynthesis.getVoices(),
        voiceId
      );
    }

    if (japaneseVoiceRef.current) {
      utterance.voice = japaneseVoiceRef.current;
    }

    window.speechSynthesis.speak(utterance);
  }, [word, voiceId]);

  return speak;
};
