import { useCallback, useEffect, useRef } from "react";

export const useSpeak = (word: string) => {
  const japaneseVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
    japaneseVoiceRef.current =
      voices.find((voice) => voice.lang === "ja-JP") || null;
  }, []);

  const speak = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "ja-JP";

    // If voice wasn't loaded initially, try again
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
