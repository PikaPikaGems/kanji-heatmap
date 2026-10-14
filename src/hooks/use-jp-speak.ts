import { useCallback, useEffect, useRef, useState } from "react";
import { resolveJpVoice } from "@/lib/tts";
import {
  aiVoiceNeedsReload,
  canSpeakAi,
  loadAiVoice,
  reportAiSpeakFailure,
  speakAi,
  stopAiSpeech,
} from "@/lib/ai-voice/engine";
import { useCurrentJpVoice } from "./use-jp-voice";
import { useVoiceEngine } from "./use-ai-voice";

/**
 * "preparing": tapped, the AI voice is still generating (or reloading) audio.
 * "speaking": AI audio is playing. The browser voice starts at once, so it
 * stays "idle".
 */
export type SpeakStatus = "idle" | "preparing" | "speaking";

/** Browser voice rate for the snail ("say it slowly") buttons. */
const SLOW_BROWSER_RATE = 0.6;

/** How long the AI voice may take to start before the browser voice reads it instead. */
const AI_START_DEADLINE_MS = 8000;

// iOS lets speechSynthesis talk outside a tap only after it has spoken inside
// one. The fallback below runs after the AI voice fails, outside the tap, so
// it was silent too. Speaking an empty utterance inside a tap unlocks it.
let browserVoiceUnlocked = false;
const unlockBrowserVoice = () => {
  if (browserVoiceUnlocked) return;
  // Not inside a tap (e.g. read aloud when a card appears): try the next one.
  if (navigator.userActivation?.isActive === false) return;
  browserVoiceUnlocked = true;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
};

/** Small kana that join the kana before them into one mora (きょ, ファ). */
const SMALL_KANA = /[ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ]/g;

/**
 * One kana sound (め, ジ, きょ). The AI voice often reads these too quietly
 * to hear, so the browser voice reads them instead.
 */
const isSingleMora = (word: string) =>
  /^[ぁ-ゖァ-ヺ]$/.test(word.replace(SMALL_KANA, "").trim());

// Page-wide: the newest speak() wins. An AI call that fails after a newer
// speak() started must not fall back and talk over it.
let latestSpeakId = 0;

/**
 * Speaks `word` with the user's engine: the AI voice when AI Voice Mode is on
 * and it's ready, otherwise (or if it fails) the browser's text-to-speech.
 * Never throws. `slow` reads it slower (snail buttons).
 */
export const useSpeakWithStatus = (word: string, slow = false) => {
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
    if (slow) utterance.rate = SLOW_BROWSER_RATE;

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
  }, [word, voiceId, slow]);

  const speak = useCallback(() => {
    const id = ++latestSpeakId;

    if (engine !== "ai" || !canSpeakAi() || isSingleMora(word)) {
      stopAiSpeech();
      speakWithBrowser();
      return;
    }

    if (aiVoiceNeedsReload()) {
      // The memory was freed (e.g. the app was in the background). Reloading
      // takes seconds on a phone, so read this one with the browser voice
      // and reload the AI voice for the next one.
      stopAiSpeech();
      speakWithBrowser();
      void loadAiVoice();
      return;
    }

    window.speechSynthesis.cancel();
    unlockBrowserVoice();
    const ownCall = ++ownCallRef.current;
    setStatus("preparing");

    const fallBack = () => {
      if (latestSpeakId === id) speakWithBrowser();
    };
    let started = false;
    const deadline = window.setTimeout(() => {
      if (started || latestSpeakId !== id) return;
      reportAiSpeakFailure(
        "The AI voice took too long to start, so the browser voice was used."
      );
      stopAiSpeech();
      fallBack();
    }, AI_START_DEADLINE_MS);

    speakAi(word, {
      slow,
      onStart: () => {
        started = true;
        if (ownCallRef.current === ownCall) setStatus("speaking");
      },
    })
      .catch(fallBack)
      .finally(() => {
        window.clearTimeout(deadline);
        if (ownCallRef.current === ownCall) setStatus("idle");
      });
  }, [engine, word, slow, speakWithBrowser]);

  return { speak, status };
};

export const useSpeak = (word: string) => useSpeakWithStatus(word).speak;
