import { useState } from "react";
import type { FsrsRating } from "engine-contract";
import { PracticeButton } from "@/components/ui/practice-button";
import { useArmedConfirmKey } from "@/hooks/use-armed-confirm-key";
import { RATING_KEYS, ratingForKey } from "@/components/shared-practice";
import { feedbackTitle } from "@/lib/dakanji-grade";
import { StrokeOrderPlayer } from "../StrokeOrderPlayer";
import { StrokePreview } from "../StrokePreview";
import { WritingPracticeModal } from "../WritingPracticeModal";
import type { DrawingSnapshot, GradeRankInfo, PracticeItem } from "../types";
import { ItemReveal } from "./ItemReveal";
import {
  NextKanjiFooter,
  PracticeDrawerShell,
  RatingFooter,
} from "./PracticeDrawerShell";

/** Side-by-side preview size; stays under ~42vw so 320px phones don't overflow. */
const PREVIEW_SIZE = 130;

const ENTER_OR_SPACE = ["Enter", " "] as const;
/** Mastery: the "Next" keys plus H / G / E, all of which rate. */
const RATING_OR_SPACE = [...RATING_KEYS, " "] as const;

export const FeedbackDrawer = ({
  open,
  kind,
  item,
  grade,
  drawing,
  gradingEnabled = true,
  rating,
  onNext,
}: {
  open: boolean;
  kind: "noKanji" | "correct" | "incorrect";
  item: PracticeItem;
  grade: GradeRankInfo;
  drawing: DrawingSnapshot | null;
  gradingEnabled?: boolean;
  /** Mastery game, correct answer: rating buttons replace "Next Kanji". */
  rating?: {
    intervals: Record<FsrsRating, string>;
    onRate: (rating: FsrsRating) => void;
  };
  onNext: () => void;
}) => {
  const [practiceOpen, setPracticeOpen] = useState(false);

  // Enter/Space → Next Kanji. Arm after a beat so the key that opened
  // feedback (e.g. Enter on Select → Next) doesn't also advance. When
  // rating, Enter/Space mean Good and H / G / E mean Hard / Good / Easy.
  useArmedConfirmKey({
    onConfirm: (key) => {
      if (!rating) {
        onNext();
        return;
      }
      rating.onRate(ratingForKey(key) ?? "good");
    },
    enabled: open && !practiceOpen,
    keys: rating ? RATING_OR_SPACE : ENTER_OR_SPACE,
  });

  const title =
    kind === "noKanji"
      ? "No worries — here it is"
      : !gradingEnabled && kind === "correct"
        ? "🎉 That's the one!"
        : feedbackTitle(
            kind === "correct" ? "correct" : "incorrect",
            grade.rank
          );

  // Celebrate any correct pick when stroke grading is off.
  const bounce = kind === "correct" && (!gradingEnabled || grade.rank === 0);

  return (
    <>
      <PracticeDrawerShell
        open={open}
        showHandle={false}
        title={title}
        titleClassName={bounce ? "animate-practice-bounce-soft" : undefined}
        description={<ItemReveal item={item} />}
        footer={
          rating ? (
            <RatingFooter intervals={rating.intervals} onRate={rating.onRate} />
          ) : (
            <NextKanjiFooter onNext={onNext} />
          )
        }
      >
        {kind === "noKanji" ? (
          <div className="flex flex-col items-center gap-2 px-3 pb-2 mt-4 overflow-y-auto sm:px-4">
            {/* Mount only while open so DMAK doesn't finish animating off-screen. */}
            {open && (
              <StrokeOrderPlayer kanji={item.kanji} size={PREVIEW_SIZE + 30} />
            )}
            <PracticeButton
              size="default"
              variant="ghost"
              className="text-sm underline underline-offset-4 decoration-dotted"
              onClick={() => setPracticeOpen(true)}
            >
              Practice More
            </PracticeButton>
          </div>
        ) : (
          <div className="px-2 pt-4 pb-2 mt-2 overflow-y-auto sm:px-3">
            {/* flex + w-fit keeps the two columns tight (grid max-w-* stretched them apart). */}
            <div className="flex flex-row items-start justify-center gap-2 mx-auto w-fit sm:gap-3">
              <div className="flex flex-col items-center gap-2 shrink-0 min-w-[155px]">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  You Drew
                </p>
                {drawing && drawing.strokes.length > 0 ? (
                  <StrokePreview
                    strokes={drawing.strokes}
                    sourceSize={drawing.width}
                    displaySize={PREVIEW_SIZE}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center text-sm border-2 border-dashed text-muted-foreground rounded-3xl"
                    style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                  >
                    —
                  </div>
                )}
                <PracticeButton
                  size="default"
                  variant="ghost"
                  className="text-sm underline underline-offset-4 decoration-dotted"
                  onClick={() => setPracticeOpen(true)}
                >
                  Practice More
                </PracticeButton>
              </div>
              <div className="flex flex-col items-center gap-2  shrink-0 min-w-[155px]">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Stroke Order
                </p>
                {open && (
                  <StrokeOrderPlayer kanji={item.kanji} size={PREVIEW_SIZE} />
                )}
              </div>
            </div>
          </div>
        )}
      </PracticeDrawerShell>

      <WritingPracticeModal
        open={practiceOpen}
        onOpenChange={setPracticeOpen}
        kanji={item.kanji}
      />
    </>
  );
};
