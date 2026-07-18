import { useEffect, useState } from "react";
import { useSetOpenedParam } from "@/components/dependent/routing/routing-hooks";
import { ActivityKind, recordActivity } from "@/lib/activity";
import { PracticeItem } from "./types";

export type PracticeSessionPhase = "initial" | "loading" | "playing" | "ended";

/**
 * Shared practice-session state machine used by the recognition and
 * production practice screens: deck/cursor bookkeeping, chunked sessions,
 * retry-the-forgotten-ones flow, and phase transitions.
 *
 * Divergent behavior is injected:
 * - `onPlay`: wraps the transition into "playing" (production warms the
 *   handwriting model first and may park the phase on "loading").
 * - `onSessionStart`: runs at the start of a user-initiated session
 *   (recognition focuses its keyboard-primer input).
 * - `onGoToInitial`: extra state resets when returning to the start screen.
 */
export const usePracticeSession = <
  TResult extends PracticeItem & { correct: boolean },
>({
  activityKind,
  sessionSize,
  onPlay,
  onSessionStart,
  onGoToInitial,
}: {
  activityKind: ActivityKind;
  sessionSize: number;
  onPlay?: (commitPlaying: () => void) => void;
  onSessionStart?: () => void;
  onGoToInitial?: () => void;
}) => {
  const [phase, setPhase] = useState<PracticeSessionPhase>("initial");
  const [progress, setProgress] = useState(0);
  const [deck, setDeck] = useState<PracticeItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [sessionItems, setSessionItems] = useState<PracticeItem[]>([]);
  const [sessionKey, setSessionKey] = useState(0);
  const [results, setResults] = useState<TResult[] | null>(null);
  const [runResults, setRunResults] = useState<TResult[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const setOpenedKanji = useSetOpenedParam();

  // Effect needed: syncs the external ?open= URL param — the kanji drawer is
  // only allowed on the end screen, and this also clears a stale param when
  // the page is entered directly with one in the URL.
  useEffect(() => {
    if (phase !== "ended") {
      setOpenedKanji(null);
    }
  }, [phase, setOpenedKanji]);

  const commitPlaying = () => setPhase("playing");

  /** Prepare the next session's state, then enter "playing" (via onPlay). */
  const play = (
    items: PracticeItem[],
    nextCursor: number,
    builtDeck?: PracticeItem[]
  ) => {
    if (builtDeck) setDeck(builtDeck);
    setSessionItems(items);
    setCursor(nextCursor);
    setSessionKey((k) => k + 1);
    setProgress(0);
    setResults(null);
    if (onPlay) {
      onPlay(commitPlaying);
    } else {
      commitPlaying();
    }
  };

  const goToInitial = () => {
    setProgress(0);
    setResults(null);
    setRunResults([]);
    setHasMore(true);
    setDeck([]);
    setCursor(0);
    setSessionItems([]);
    onGoToInitial?.();
    setPhase("initial");
  };

  const startGame = (builtDeck: PracticeItem[]) => {
    onSessionStart?.();
    setRunResults([]);
    setHasMore(true);
    const chunk = builtDeck.slice(0, sessionSize);
    play(chunk, chunk.length, builtDeck);
  };

  const finishSession = (sessionResults: TResult[]) => {
    const forgottens = sessionResults.filter((r) => !r.correct);
    const moreLeft = forgottens.length > 0 || cursor < deck.length;

    recordActivity(activityKind);
    setRunResults((prev) => [...prev, ...sessionResults]);
    setResults(sessionResults);
    setHasMore(moreLeft);
    if (!moreLeft) setProgress(100);
    setPhase("ended");
  };

  const startNextSession = () => {
    if (!hasMore) return;
    onSessionStart?.();

    const forgottens = (results ?? [])
      .filter((r) => !r.correct)
      .map(
        ({ kanji, word, reading, englishGloss, keyword, fontIndex }) =>
          ({
            kanji,
            word,
            reading,
            englishGloss,
            keyword,
            fontIndex,
          }) satisfies PracticeItem
      );

    const remaining = deck.slice(cursor);
    const pool = [...forgottens, ...remaining];
    if (pool.length === 0) {
      // Nothing left — treat as complete rather than looping forever.
      setHasMore(false);
      setPhase("ended");
      return;
    }

    const chunk = pool.slice(0, sessionSize);
    const fromRemaining = Math.max(0, chunk.length - forgottens.length);
    play(chunk, cursor + fromRemaining);
  };

  return {
    phase,
    setPhase,
    progress,
    setProgress,
    deck,
    cursor,
    sessionItems,
    sessionKey,
    results,
    runResults,
    hasMore,
    play,
    goToInitial,
    startGame,
    finishSession,
    startNextSession,
  };
};
