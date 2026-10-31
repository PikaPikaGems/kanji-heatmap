import type { RecentFailedOperation, SyncOperation } from "engine-contract";
import { CARD_TYPE_LABELS } from "@/lib/engine/card-types";
import { practiceActivityLabel } from "@/lib/practice/activity";
import {
  Bookmark,
  Gamepad2,
  Keyboard,
  ListMinus,
  ListPlus,
  SlidersHorizontal,
  SquarePen,
  Trophy,
  type LucideIcon,
} from "lucide-react";

type OperationType = SyncOperation["type"];

/** Icon and plain-language name per operation type (design 5.7). */
const OPERATION_INFO: Record<
  OperationType,
  { label: string; Icon: LucideIcon }
> = {
  "note-save": { label: "Note", Icon: SquarePen },
  "bookmark-save": { label: "Bookmark", Icon: Bookmark },
  "review-settings-update": {
    label: "Review settings",
    Icon: SlidersHorizontal,
  },
  "review-pile-add": { label: "Added to review pile", Icon: ListPlus },
  "review-pile-remove": { label: "Removed from review pile", Icon: ListMinus },
  "review-grade": { label: "Review", Icon: Trophy },
  speed_katakana_session_completed: {
    label: "Speed Katakana",
    Icon: Keyboard,
  },
  generic_challenge_completed: { label: "Practice activity", Icon: Gamepad2 },
};

export const operationIcon = (type: OperationType) => OPERATION_INFO[type].Icon;

export const operationLabel = (type: OperationType) =>
  OPERATION_INFO[type].label;

/** Label for a queued operation, with its details where they help. */
export const describeOperation = (op: SyncOperation): string => {
  if (op.type === "bookmark-save") {
    return op.isActive ? "Bookmark added" : "Bookmark removed";
  }
  if (op.type === "review-grade") {
    return `${CARD_TYPE_LABELS[op.cardType]} review: ${op.grade}`;
  }
  if (op.type === "generic_challenge_completed") {
    return practiceActivityLabel(op.activityType) ?? operationLabel(op.type);
  }
  return operationLabel(op.type);
};

/** The kanji a queued operation is about, if it has one. */
export const operationKanji = (op: SyncOperation): string | undefined =>
  "kanji" in op ? op.kanji : undefined;

/** What a failed operation was about: card type and/or activity. */
export const describeSubject = (
  subject: RecentFailedOperation["subject"]
): string => {
  const parts: string[] = [];
  if (subject?.cardType) parts.push(`${subject.cardType} card`);
  if (subject?.activityType)
    parts.push(subject.activityType.replace(/_/g, " "));
  return parts.join(" · ");
};

/** User-written text a rejected operation still holds, for "Copy text". */
export const recoverableText = (op: RecentFailedOperation): string | null => {
  if (op.payload?.type === "note-save") return op.payload.content;
  if (op.payload?.type === "review-pile-add") return op.payload.word;
  return null;
};
