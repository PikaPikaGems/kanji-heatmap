import { useState } from "react";
import { REVIEW_PILE_ADD_WORD_MAX_UTF8_BYTES } from "engine-contract";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { utf8ByteLength } from "@/components/sections/KanjiDetails/KanjiStudyNotes/utf8-bytes";
import { copyForCode } from "./engine-copy";
import { useEngineApi } from "./use-engine-query";

/**
 * Adds one kanji to the review pile with its representative word. Shared by
 * the drawer's pile button and the "Your progress" notice so both report the
 * same busy / error states. On success the pile watch flips to "in pile" and
 * both callers re-render, so there is no success state to show.
 */
export const useAddToReviewPile = (kanji: string, word: string) => {
  const api = useEngineApi();
  const [action, setAction] = useState<ActionStatus>({ kind: "idle" });

  const tooLong = utf8ByteLength(word) > REVIEW_PILE_ADD_WORD_MAX_UTF8_BYTES;

  const add = async () => {
    if (!api || action.kind === "busy") return;
    setAction({ kind: "busy" });
    const result = await api.reviews.pile.add({ kanji, word });
    setAction(
      result.ok
        ? { kind: "idle" }
        : { kind: "error", message: copyForCode(result.error.code) }
    );
  };

  return { add, action, tooLong, hasApi: api != null };
};
