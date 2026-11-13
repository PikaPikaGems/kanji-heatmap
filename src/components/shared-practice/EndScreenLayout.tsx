import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PracticeButton } from "@/components/ui/practice-button";
import { PracticeBottomBar } from "./PracticeBottomBar";

/** When Continue (or a lone Done) can be tapped, and when "I'm done" can. */
const CONTINUE_UNLOCK_MS = 1500;
const DONE_UNLOCK_MS = 3000;

/** Which of the end screen's buttons can be tapped yet. */
type ButtonLock = "all" | "done-only" | "none";

/**
 * On phones the answer drawer's Continue sits right where "I'm done" appears,
 * so a player tapping through quickly would leave by accident. The buttons
 * wait (showing a spinner) before they take taps: Continue 1.5 s, "I'm done"
 * 3 s.
 */
const useButtonLock = (): ButtonLock => {
  const [lock, setLock] = useState<ButtonLock>("all");
  // Effect needed: timers that unlock the buttons after the screen appears,
  // and must be cleared if it goes away first.
  useEffect(() => {
    const first = setTimeout(() => setLock("done-only"), CONTINUE_UNLOCK_MS);
    const second = setTimeout(() => setLock("none"), DONE_UNLOCK_MS);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, []);
  return lock;
};

/** The label, or a spinner while the button is still locked. */
const LockedLabel = ({
  locked,
  children,
}: {
  locked: boolean;
  children: ReactNode;
}) =>
  locked ? <Loader2 aria-label="Wait" className="animate-spin" /> : children;

/**
 * The one end-of-round / end-of-session screen for every practice and mastery
 * game: cheer heading, optional stat row and content scrolling above the
 * bottom bar (the same bar the start screens use) with Continue and "I'm
 * done", or a single "Done" when there is nothing left to do, and an optional
 * notice under them. Keyboard handling and cheer selection stay with the
 * callers.
 */
export const EndScreenLayout = ({
  cheer,
  subtitle,
  headingExtra,
  stats,
  children,
  onContinue,
  continueLabel = "Continue",
  onEnd,
  notice,
}: {
  cheer: string;
  /** One line under the cheer, e.g. "7/10 correct this round". */
  subtitle?: string;
  headingExtra?: ReactNode;
  /** Big numbers shown in a wrapping row under the heading. */
  stats?: ReactNode;
  /** Anything else for the scrolling area: recap tiles, links. */
  children?: ReactNode;
  /** The next round; omit when there is nothing left to do. */
  onContinue?: () => void;
  /** E.g. Fill the Kanji's "Retry Mistakes". */
  continueLabel?: string;
  /** Leaves the game: "I'm done" next to Continue, otherwise "Done". */
  onEnd: () => void;
  /** Under the buttons, e.g. "progress not saved". */
  notice?: ReactNode;
}) => {
  const lock = useButtonLock();
  const continueLocked = lock === "all";
  const doneLocked = lock !== "none";

  return (
    <div className="flex flex-col w-full h-full animate-fade-in">
      {/* m-auto centers the content in the space above the bar and, unlike
        justify-center, still scrolls from the top when it overflows. */}
      <div className="flex flex-col flex-1 min-h-0 px-4 pt-4 overflow-y-auto">
        <div className="flex flex-col items-center w-full max-w-md gap-10 pb-6 m-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold kanji-font animate-practice-bounce-soft">
              🎉 {cheer}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                {subtitle}
              </p>
            )}
            {headingExtra}
          </div>

          {stats && (
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
              {stats}
            </div>
          )}

          {children}
        </div>
      </div>

      <PracticeBottomBar>
        {onContinue ? (
          <>
            <PracticeButton
              size="lg"
              disabled={continueLocked}
              onClick={onContinue}
            >
              <LockedLabel locked={continueLocked}>{continueLabel}</LockedLabel>
            </PracticeButton>
            <PracticeButton
              size="md"
              variant="ghost"
              disabled={doneLocked}
              onClick={onEnd}
            >
              <LockedLabel locked={doneLocked}>I&apos;m done</LockedLabel>
            </PracticeButton>
          </>
        ) : (
          <PracticeButton size="lg" disabled={continueLocked} onClick={onEnd}>
            <LockedLabel locked={continueLocked}>Done</LockedLabel>
          </PracticeButton>
        )}
        {/* Dotted line between the buttons and the notice; `empty:hidden`
          drops it when the notice renders nothing. */}
        <div className="pt-3 mt-1 border-t border-dotted empty:hidden">
          {notice}
        </div>
      </PracticeBottomBar>
    </div>
  );
};
