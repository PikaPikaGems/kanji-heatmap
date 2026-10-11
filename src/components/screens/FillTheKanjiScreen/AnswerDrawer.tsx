import { PracticeButton } from "@/components/ui/practice-button";
import { GenericPopover } from "@/components/common/GenericPopover";
import { PracticeDrawerShell } from "@/components/production-practice-v1/drawers/PracticeDrawerShell";
import { useArmedConfirmKey } from "@/hooks/use-armed-confirm-key";
import { SpanBadge } from "@/components/ui/badge";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { FillTheKanjiItem } from "@/lib/fill-the-kanji/types";
import { FuriganaSentence } from "./SentencePrompt";
import { SpeakButtons } from "./SpeakButtons";
import type { SentenceSpeech } from "./use-fill-the-kanji-game";

/** "almost": wrong, but at least half the blanks were right. */
export type FeedbackKind = "correct" | "almost" | "wrong" | "forgot";

/** The last answer shown; kept after closing so the drawer can slide away. */
export type AnswerState = {
  open: boolean;
  item: FillTheKanjiItem;
  kind: FeedbackKind;
} | null;

const TITLES: Record<FeedbackKind, string> = {
  correct: "🎉 Correct!",
  almost: "😅 Almost there!",
  wrong: "🙈 Not quite",
  forgot: "🫶 No worries",
};

const CONFIRM_KEYS = ["Enter", " "] as const;

/** Notes and tags as written in the data, in a scrollable popover. */
const NotesPopover = ({ item }: { item: FillTheKanjiItem }) => (
  <GenericPopover
    // Inside a drawer: modal, or the popover can't be clicked.
    modal
    trigger={
      <button
        type="button"
        className={cn(cnDottedUnderlineTrigger, "text-xs text-foreground")}
      >
        View notes
      </button>
    }
    // Up to 24rem wide; shorter notes shrink the popover to fit.
    contentClassName="w-auto max-w-[min(24rem,calc(100vw-2rem))] p-0"
    content={
      <div className="flex flex-col gap-3 px-4 py-3 text-sm text-center">
        {item.notes ? (
          <p className="whitespace-pre-line" lang="ja">
            {item.notes}
          </p>
        ) : (
          <p className="text-muted-foreground">No notes for this sentence.</p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 pt-2 border-t border-dotted">
            {item.tags.map((tag) => (
              <SpanBadge
                key={tag}
                variant="outline"
                className="font-medium text-muted-foreground"
              >
                {tag}
              </SpanBadge>
            ))}
          </div>
        )}
      </div>
    }
  />
);

/**
 * Bottom-sheet answer reveal after Next or Forgot, using the writing-practice
 * drawer chrome (dashed top border, slide-up, bouncing title).
 */
export const AnswerDrawer = ({
  answer,
  speech,
  onContinue,
}: {
  answer: AnswerState;
  /** The answered sentence's speech (the drawer opens on the current card). */
  speech: SentenceSpeech;
  onContinue: () => void;
}) => {
  const open = answer?.open ?? false;

  // Don't treat the Enter that submitted the answer as "Continue".
  useArmedConfirmKey({
    onConfirm: onContinue,
    enabled: open,
    keys: CONFIRM_KEYS,
  });

  if (!answer) return null;
  const { item, kind } = answer;
  const hasNotes = item.notes !== "" || item.tags.length > 0;

  return (
    <PracticeDrawerShell
      open={open}
      // The shell's title is text-lg; these headings read better smaller.
      title={<span className="text-xs">{TITLES[kind]}</span>}
      description={
        <div className="max-h-[30dvh] overflow-y-auto px-1">
          {/* text-foreground: the drawer description is muted by default. */}
          <FuriganaSentence
            jp={item.jp}
            className="text-2xl sm:text-3xl text-foreground"
          />
          <p className="pt-1 text-xs text-foreground">{item.en}</p>
        </div>
      }
      footer={
        <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-md mx-auto w-full">
          <PracticeButton size="lg" onClick={onContinue}>
            Continue
          </PracticeButton>
        </div>
      }
    >
      <div className="flex items-center justify-center gap-3 px-4">
        <SpeakButtons speech={speech} />
        {hasNotes && <NotesPopover item={item} />}
      </div>
    </PracticeDrawerShell>
  );
};
