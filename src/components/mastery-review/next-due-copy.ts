import type { UTCTimestamp } from "engine-contract";
import { formatInterval } from "@/lib/engine/format-interval";

/** Message for "no card is due right now". */
export const nextDueCopy = (nextDueAt: UTCTimestamp | null | undefined) => {
  if (nextDueAt === undefined) return "Nothing due.";
  if (nextDueAt === null) {
    return "Nothing due. Add kanji to your review pile from the kanji details.";
  }
  const inMs = Date.parse(nextDueAt) - Date.now();
  return `Nothing due — next review in ${formatInterval(inMs)}`;
};
