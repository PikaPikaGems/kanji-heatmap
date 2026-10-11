import { useEffect, useRef, useState } from "react";
import { useSpeak } from "@/hooks/use-jp-speak";
import { useKeepAiVoiceWarm } from "@/hooks/use-ai-voice";
import { useCorrectSound } from "@/hooks/use-correct-sound";
import { plainSentence, Puzzle } from "@/lib/fill-the-kanji/puzzle";
import { FillTheKanjiItem } from "@/lib/fill-the-kanji/types";
import { AnswerState, FeedbackKind } from "./AnswerDrawer";
import { FillTheKanjiSettings, ItemResult } from "./types";

export type GameCard = {
  item: FillTheKanjiItem;
  puzzle: Puzzle;
  tiles: string[];
};

const emptyFill = (card: GameCard | undefined) =>
  Array.from({ length: card?.puzzle.blanks.length ?? 0 }, () => null);

/** Next empty blank after `from`, wrapping around; null when all are filled. */
const nextEmpty = (filled: (string | null)[], from: number): number | null => {
  for (let step = 1; step <= filled.length; step++) {
    const i = (from + step) % filled.length;
    if (filled[i] == null) return i;
  }
  return null;
};

const isEditableTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
};

/**
 * The Fill the Kanji game loop: card cursor, which blank is selected, what
 * each blank holds, answer feedback, and keyboard shortcuts (1–8 pick a tile,
 * ! reads the sentence aloud, Backspace / Delete undo the most recently placed
 * kanji, Enter submits once every blank is filled). The Game component stays
 * responsible for loading and rendering.
 */
export const useFillTheKanjiGame = ({
  cards,
  sound,
  readAloudOnShow,
  onProgress,
  onComplete,
}: {
  cards: GameCard[];
  sound: FillTheKanjiSettings["sound"];
  readAloudOnShow: boolean;
  onProgress: (progress: number) => void;
  onComplete: (results: ItemResult[]) => void;
}) => {
  const [index, setIndex] = useState(0);
  const [filled, setFilled] = useState<(string | null)[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  // Blanks in the order they were filled, so undo removes the latest pick.
  const [placed, setPlaced] = useState<number[]>([]);
  const [answer, setAnswer] = useState<AnswerState>(null);
  const feedback: FeedbackKind | null = answer?.open ? answer.kind : null;
  const resultsRef = useRef<ItemResult[]>([]);

  const card = cards[index];

  // Cards arrive after the set and similar-kanji map load; size the blanks
  // for the first card then (previous-state pattern, no effect needed).
  const [preparedFor, setPreparedFor] = useState<GameCard | undefined>();
  if (card !== preparedFor) {
    setPreparedFor(card);
    setFilled(emptyFill(card));
    setPlaced([]);
    setCursor(0);
  }

  const speak = useSpeak(card ? plainSentence(card.item.jp) : "");
  // Games keep the AI voice in memory so words after a pause play promptly.
  useKeepAiVoiceWarm();
  const playCorrect = useCorrectSound();

  // Effect needed: speaking is a side effect of a new item appearing. Keyed
  // on the card only, so re-renders within an item don't repeat it.
  const speakRef = useRef(speak);
  speakRef.current = speak;
  useEffect(() => {
    if (readAloudOnShow && card) speakRef.current();
  }, [card, readAloudOnShow]);

  const allFilled = filled.length > 0 && filled.every((k) => k != null);

  const pickTile = (kanji: string) => {
    if (feedback != null || !card) return;
    const target = cursor ?? nextEmpty(filled, -1);
    if (target == null) return;
    const next = [...filled];
    next[target] = kanji;
    setFilled(next);
    setPlaced([...placed.filter((b) => b !== target), target]);
    setCursor(nextEmpty(next, target));
  };

  const selectBlank = (blank: number) => {
    if (feedback != null) return;
    if (filled[blank] != null) {
      const next = [...filled];
      next[blank] = null;
      setFilled(next);
      setPlaced(placed.filter((b) => b !== blank));
    }
    setCursor(blank);
  };

  /** Takes back the most recently placed kanji and reselects its blank. */
  const undo = () => {
    if (feedback != null) return;
    const last = placed[placed.length - 1];
    if (last == null) return;
    const next = [...filled];
    next[last] = null;
    setFilled(next);
    setPlaced(placed.slice(0, -1));
    setCursor(last);
  };

  const submit = () => {
    if (feedback != null || !card || !allFilled) return;
    const correct = filled.every((k, i) => k === card.puzzle.blanks[i]);
    resultsRef.current = [...resultsRef.current, { item: card.item, correct }];
    if (correct) {
      playCorrect({
        enabled: sound.enabled,
        speak: sound.enabled && sound.type === "speak" ? speak : undefined,
      });
    } else if (sound.enabled) {
      // A miss always reads the right sentence aloud, in either sound mode.
      speak();
    }
    setCursor(null);
    setAnswer({
      open: true,
      item: card.item,
      kind: correct ? "correct" : "wrong",
    });
  };

  const forgot = () => {
    if (feedback != null || !card || allFilled) return;
    resultsRef.current = [
      ...resultsRef.current,
      { item: card.item, correct: false },
    ];
    if (sound.enabled) speak();
    setCursor(null);
    setAnswer({ open: true, item: card.item, kind: "forgot" });
  };

  const advance = () => {
    if (feedback == null) return;
    const nextIndex = index + 1;
    // Keep the item so the drawer slides away showing this answer.
    setAnswer((prev) => (prev ? { ...prev, open: false } : prev));
    if (nextIndex >= cards.length) {
      onProgress(100);
      onComplete(resultsRef.current);
      return;
    }
    // Progress is reported here (the only place index advances) rather than
    // via an effect; the parent resets it to 0 when a round starts.
    onProgress((nextIndex / cards.length) * 100);
    setIndex(nextIndex);
  };

  // Latest handlers for the window listener below, without resubscribing.
  const handlersRef = useRef({ pickTile, undo, submit, allFilled, speak });
  handlersRef.current = { pickTile, undo, submit, allFilled, speak };
  const tilesRef = useRef<string[]>([]);
  tilesRef.current = card?.tiles ?? [];

  // Effect needed: subscribes to window keydown for the tile shortcuts and
  // must unsubscribe on unmount.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 8) {
        const kanji = tilesRef.current[digit - 1];
        if (kanji) {
          e.preventDefault();
          handlersRef.current.pickTile(kanji);
        }
        return;
      }
      if (e.key === "!") {
        e.preventDefault();
        handlersRef.current.speak();
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handlersRef.current.undo();
        return;
      }
      if (e.key === "Enter") {
        // Until every blank is filled, let Enter activate a focused button
        // (e.g. Forgot) as usual; once filled, Enter always submits, even
        // when a tile clicked last still has focus.
        const onButton = (e.target as HTMLElement | null)?.tagName === "BUTTON";
        if (onButton && !handlersRef.current.allFilled) return;
        e.preventDefault();
        handlersRef.current.submit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    card,
    index,
    filled,
    cursor,
    feedback,
    answer,
    allFilled,
    pickTile,
    selectBlank,
    submit,
    forgot,
    advance,
  };
};
