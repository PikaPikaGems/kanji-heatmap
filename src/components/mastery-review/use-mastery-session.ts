import { useEffect, useRef, useState } from "react";
import type {
  ActiveReview,
  CardType,
  DueCard,
  EngineAPI,
  FsrsRating,
} from "engine-contract";
import type { PracticeItem } from "@/components/shared-practice";
import { PRACTICE_SESSION_SIZE } from "@/components/shared-practice/constants";
import { copyForCode } from "@/lib/engine/engine-copy";
import { ratingIntervalLabels } from "@/lib/engine/format-interval";
import { refreshDueCounts } from "@/lib/engine/use-due-count";
import { useEngineApi } from "@/lib/engine/use-engine-query";

/** A card the user answered this round, with the rating it got. */
export type MasteryResult = {
  kanji: string;
  keyword: string;
  rating: FsrsRating;
};

/** A grade the engine refused, for the "weren't saved" report. */
export type SaveFailure = {
  kanji: string;
  rating: FsrsRating;
  code: string;
  at: Date;
};

/**
 * - `preparing`: the host screen is getting ready (writing loads its
 *   handwriting model); it calls `markPreparing()` then `start()`.
 * - `opening`: fetching the round or the next card.
 */
export type MasteryState =
  | { status: "start"; error?: string }
  | { status: "preparing" }
  | { status: "opening" }
  | {
      status: "card";
      review: ActiveReview;
      item: PracticeItem;
      /** Frozen interval label per rating, from the review's previews. */
      intervals: Record<FsrsRating, string>;
      /** 1-based place of this card in the round. */
      position: number;
      total: number;
    }
  | {
      status: "ended";
      /** Cards of this type still due right now. */
      moreDue: number;
    };

/**
 * One review round of a mastery game (host/guide/REVIEWS.md walkthrough):
 * `getDue` → per card `beginReview` → the game UI → `grade` → next card.
 * Cards that went stale are skipped silently; an open handle is cancelled
 * when the user leaves the card or the screen.
 */
export const useMasterySession = ({
  cardType,
  getItem,
}: {
  cardType: CardType;
  /** Practice item for a kanji (null: no usable word, the card is skipped). */
  getItem: ((kanji: string) => PracticeItem | null) | null;
}) => {
  const api = useEngineApi();
  const [state, setState] = useState<MasteryState>({ status: "start" });
  const [results, setResults] = useState<MasteryResult[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveFailures, setSaveFailures] = useState<SaveFailure[]>([]);

  const queueRef = useRef<{ cards: DueCard[]; next: number }>({
    cards: [],
    next: 0,
  });
  // The card on screen, until it is graded or cancelled.
  const openCardRef = useRef<{ handleId: string; item: PracticeItem } | null>(
    null
  );
  // The grade call of the card just answered; the next card waits for it.
  const gradeRef = useRef<Promise<void>>(Promise.resolve());
  // Bumped when a round starts or stops, so a slow call from an earlier one
  // is dropped (and its handle cancelled) instead of showing a stale card.
  const runRef = useRef(0);
  const closedRef = useRef(false);

  // Effect needed: cancels the open review handle when the screen unmounts
  // (navigation), where no event handler runs.
  useEffect(() => {
    closedRef.current = false;
    return () => {
      closedRef.current = true;
      runRef.current += 1;
      const open = openCardRef.current;
      openCardRef.current = null;
      if (api && open) void api.reviews.cancel(open.handleId);
    };
  }, [api]);

  const openNext = async (engine: EngineAPI, run: number) => {
    const queue = queueRef.current;
    while (run === runRef.current && queue.next < queue.cards.length) {
      const card = queue.cards[queue.next];
      queue.next += 1;

      const item = getItem?.(card.kanji);
      if (!item) continue;

      const opened = await engine.reviews.beginReview({
        kanji: card.kanji,
        cardType,
        expectedVersion: card.version,
      });
      // stale_version or any other error: skip this card silently.
      if (!opened.ok) continue;

      if (run !== runRef.current) {
        void engine.reviews.cancel(opened.value.handleId);
        return;
      }
      openCardRef.current = { handleId: opened.value.handleId, item };
      setState({
        status: "card",
        review: opened.value,
        item,
        intervals: ratingIntervalLabels(opened.value),
        position: queue.next,
        total: queue.cards.length,
      });
      return;
    }
    if (run !== runRef.current) return;
    const left = await engine.reviews.getDueCount(cardType);
    if (run !== runRef.current) return;
    setState({ status: "ended", moreDue: left.ok ? left.value : 0 });
  };

  const start = async () => {
    if (!api || closedRef.current) return;
    runRef.current += 1;
    const run = runRef.current;
    setResults([]);
    setSaveError(null);
    setSaveFailures([]);
    setState({ status: "opening" });

    const due = await api.reviews.getDue({
      cardType,
      limit: PRACTICE_SESSION_SIZE,
    });
    if (run !== runRef.current) return;
    if (!due.ok) {
      setState({ status: "start", error: copyForCode(due.error.code) });
      return;
    }
    queueRef.current = { cards: due.value, next: 0 };
    await openNext(api, run);
  };

  /** Grades the card on screen. Call once per card. */
  const grade = (rating: FsrsRating) => {
    const open = openCardRef.current;
    if (!api || !open) return;
    openCardRef.current = null;
    const { handleId, item } = open;
    const answered = { kanji: item.kanji, keyword: item.keyword, rating };

    gradeRef.current = (async () => {
      const result = await api.reviews.grade({ handleId, rating });
      // The header dot and start screen shouldn't wait for the next poll.
      refreshDueCounts();
      if (result.ok) {
        setResults((prev) => [...prev, answered]);
        return;
      }
      // A rejected grade leaves the handle open.
      void api.reviews.cancel(handleId);
      // stale_version: the card changed elsewhere, skip it silently.
      if (result.error.code === "stale_version") return;
      setResults((prev) => [...prev, answered]);
      setSaveError(copyForCode(result.error.code));
      setSaveFailures((prev) => [
        ...prev,
        { kanji: item.kanji, rating, code: result.error.code, at: new Date() },
      ]);
    })();
  };

  /** Moves on after the card's feedback. */
  const next = async () => {
    if (!api || closedRef.current) return;
    runRef.current += 1;
    const run = runRef.current;
    setState({ status: "opening" });
    await gradeRef.current;
    await openNext(api, run);
  };

  /** Back to the start screen, cancelling the open card. */
  const leave = () => {
    runRef.current += 1;
    const open = openCardRef.current;
    openCardRef.current = null;
    if (api && open) void api.reviews.cancel(open.handleId);
    setState({ status: "start" });
  };

  const markPreparing = () => setState({ status: "preparing" });

  const progress = (): number => {
    if (state.status === "ended") return 100;
    if (state.status !== "card") return 0;
    return ((state.position - 1) / state.total) * 100;
  };

  return {
    state,
    results,
    saveError,
    saveFailures,
    progress: progress(),
    start,
    grade,
    next,
    leave,
    markPreparing,
  };
};
