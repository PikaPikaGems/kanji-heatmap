import { useState } from "react";
import {
  REVIEW_PILE_ADD_WORD_MAX_UTF8_BYTES,
  type ReviewError,
} from "engine-contract";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { utf8ByteLength } from "@/components/sections/KanjiDetails/KanjiStudyNotes/utf8-bytes";
import { useKanjiAnchorWords } from "@/providers/kanji-representative-word-hooks";
import { copyForCode } from "./engine-copy";
import { useEngineApi } from "./use-engine-query";

/** The words a pile item is added with; both stay fixed for the item's life. */
export type PileWords = { word: string; secondaryWord?: string };

/** "高い · 最高", or just the main word. */
export const pileWordsLabel = ({ word, secondaryWord }: PileWords) =>
  secondaryWord ? `${word} · ${secondaryWord}` : word;

/**
 * The kanji's anchor words as the pile stores them. `loaded` is false until
 * the secondary word is known, so nothing is added without it (an item can't
 * gain one later). Null when the kanji has no main word.
 */
export const usePileWords = (
  kanji: string
): { words: PileWords; loaded: boolean } | null => {
  const anchors = useKanjiAnchorWords(kanji);
  if (anchors == null) return null;
  return {
    words: {
      word: anchors.main.word,
      secondaryWord: anchors.secondary?.word,
    },
    loaded: anchors.loaded,
  };
};

const DUPLICATE_WORD_COPY = "The two words of this kanji are the same.";

const copyForAddError = (error: ReviewError) =>
  error.code === "validation_failed" && error.reason === "duplicate_word"
    ? DUPLICATE_WORD_COPY
    : copyForCode(error.code);

const isTooLong = (word: string | undefined) =>
  word != null && utf8ByteLength(word) > REVIEW_PILE_ADD_WORD_MAX_UTF8_BYTES;

/**
 * Adds one kanji to the review pile with its anchor words (main and, when it
 * has one, secondary). Shared by the drawer's pile button and the "Your
 * progress" notice so both report the same busy / error states. On success
 * the pile watch flips to "in pile" and both callers re-render, so there is
 * no success state to show.
 */
export const useAddToReviewPile = (kanji: string, words: PileWords) => {
  const api = useEngineApi();
  const [action, setAction] = useState<ActionStatus>({ kind: "idle" });

  const tooLong = isTooLong(words.word) || isTooLong(words.secondaryWord);

  const add = async () => {
    if (!api || action.kind === "busy") return;
    setAction({ kind: "busy" });
    const result = await api.reviews.pile.add({
      kanji,
      word: words.word,
      ...(words.secondaryWord ? { secondaryWord: words.secondaryWord } : {}),
    });
    setAction(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForAddError(result.error) }
    );
  };

  return { add, action, tooLong, hasApi: api != null };
};
