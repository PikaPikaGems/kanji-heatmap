import { useCallback, useEffect, useRef } from "react";

export const useSpeak = (word: string) => {
  const japaneseVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      japaneseVoiceRef.current =
        voices.find((voice) => voice.lang === "ja-JP") || null;
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback(() => {
    // Cancel any ongoing speech (Chrome fix)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "ja-JP";

    if (!japaneseVoiceRef.current) {
      const voices = window.speechSynthesis.getVoices();
      japaneseVoiceRef.current =
        voices.find((voice) => voice.lang === "ja-JP") || null;
    }

    if (japaneseVoiceRef.current) {
      utterance.voice = japaneseVoiceRef.current;
    }

    window.speechSynthesis.speak(utterance);
  }, [word]);

  return speak;
};
