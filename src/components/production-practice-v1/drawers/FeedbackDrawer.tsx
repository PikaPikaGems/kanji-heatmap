import { useEffect, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { feedbackTitle } from "@/lib/dakanji-grade";
import { StrokeOrderPlayer } from "../StrokeOrderPlayer";
import { StrokePreview } from "../StrokePreview";
import { WritingPracticeModal } from "../WritingPracticeModal";
import type { DrawingSnapshot, GradeRankInfo, PracticeItem } from "../types";
import { ItemReveal } from "./ItemReveal";
import { NextKanjiFooter, PracticeDrawerShell } from "./PracticeDrawerShell";

/** Side-by-side preview size; stays under ~42vw so 320px phones don't overflow. */
const PREVIEW_SIZE = 130;

export const FeedbackDrawer = ({
  open,
  kind,
  item,
  grade,
  drawing,
  onNext,
}: {
  open: boolean;
  kind: "noKanji" | "correct" | "incorrect";
  item: PracticeItem;
  grade: GradeRankInfo;
  drawing: DrawingSnapshot | null;
  onNext: () => void;
}) => {
  const [practiceOpen, setPracticeOpen] = useState(false);

  // Enter/Space → Next Kanji. Arm after a beat so the key that opened
  // feedback (e.g. Enter on Select → Next) doesn't also advance.
  useEffect(() => {
    if (!open || practiceOpen) return;

    let armed = false;
    const arm = () => {
      armed = true;
    };
    const armTimeout = window.setTimeout(arm, 300);
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") arm();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!armed || (e.key !== "Enter" && e.key !== " ") || e.isComposing) {
        return;
      }
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (el.isContentEditable) return;
      e.preventDefault();
      onNext();
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(armTimeout);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, practiceOpen, onNext]);

  const title =
    kind === "noKanji"
      ? "No worries — here it is"
      : feedbackTitle(kind === "correct" ? "correct" : "incorrect", grade.rank);

  const bounce = kind === "correct" && grade.rank === 0;

  return (
    <>
      <PracticeDrawerShell
        open={open}
        showHandle={false}
        title={title}
        titleClassName={bounce ? "animate-practice-bounce-soft" : undefined}
        description={<ItemReveal item={item} />}
        footer={<NextKanjiFooter onNext={onNext} />}
      >
        {kind === "noKanji" ? (
          <div className="flex flex-col items-center gap-2 px-3 pb-2 mt-4 overflow-y-auto sm:px-4">
            <StrokeOrderPlayer kanji={item.kanji} size={PREVIEW_SIZE + 30} />
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
                <StrokeOrderPlayer kanji={item.kanji} size={PREVIEW_SIZE} />
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
