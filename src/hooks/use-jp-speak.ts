import { useCallback } from "react";

export const useSpeak = (word: string) => {
  const speak = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "ja-JP";
    // Find a Japanese voice (if available)
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoice = voices.find((voice) => voice.lang === "ja-JP");
    if (japaneseVoice) utterance.voice = japaneseVoice;

    window.speechSynthesis.speak(utterance);
  }, [word]);

  return speak;
};
