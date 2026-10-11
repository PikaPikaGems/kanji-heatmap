import { useCallback, useEffect, useRef, useState } from "react";
import { resolveJpVoice } from "@/lib/tts";
import { canSpeakAi, speakAi, stopAiSpeech } from "@/lib/ai-voice/engine";
import { useCurrentJpVoice } from "./use-jp-voice";
import { useVoiceEngine } from "./use-ai-voice";

/**
 * "preparing": tapped, the AI voice is still generating (or reloading) audio.
 * "speaking": AI audio is playing. The browser voice starts at once, so it
 * stays "idle".
 */
export type SpeakStatus = "idle" | "preparing" | "speaking";

// Page-wide: the newest speak() wins. An AI call that fails after a newer
// speak() started must not fall back and talk over it.
let latestSpeakId = 0;

/**
 * Speaks `word` with the user's engine: the AI voice when AI Voice Mode is on
 * and it's ready, otherwise (or if it fails) the browser's text-to-speech.
 * Never throws.
 */
export const useSpeakWithStatus = (word: string) => {
  const [voiceId] = useCurrentJpVoice();
  const [engine] = useVoiceEngine();
  const [status, setStatus] = useState<SpeakStatus>("idle");
  const japaneseVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // This component's newest call, so an older call finishing doesn't reset it.
  const ownCallRef = useRef(0);

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

  const speakWithBrowser = useCallback(() => {
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

  const speak = useCallback(() => {
    const id = ++latestSpeakId;

    if (engine !== "ai" || !canSpeakAi()) {
      stopAiSpeech();
      speakWithBrowser();
      return;
    }

    window.speechSynthesis.cancel();
    const ownCall = ++ownCallRef.current;
    setStatus("preparing");

    speakAi(word, {
      onStart: () => {
        if (ownCallRef.current === ownCall) setStatus("speaking");
      },
    })
      .catch(() => {
        if (latestSpeakId === id) speakWithBrowser();
      })
      .finally(() => {
        if (ownCallRef.current === ownCall) setStatus("idle");
      });
  }, [engine, word, speakWithBrowser]);

  return { speak, status };
};

export const useSpeak = (word: string) => useSpeakWithStatus(word).speak;
