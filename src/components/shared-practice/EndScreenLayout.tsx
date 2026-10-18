import { ReactNode, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { PracticeBottomBar } from "./PracticeBottomBar";

/**
 * How long after the screen appears its buttons ignore taps (the length of
 * its fade-in). On touch screens a second tap on the previous screen's
 * Continue (the answer drawer's, say) lands here, often on "I'm done", and
 * would end the session by accident.
 */
const TAP_GUARD_MS = 500;

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
  /** Leaves the game: "I'm done" next to Continue, otherwise "Done". */
  onEnd: () => void;
  /** Under the buttons, e.g. "progress not saved". */
  notice?: ReactNode;
}) => {
  const [shownAt] = useState(() => Date.now());
  const guarded = (action: () => void) => () => {
    if (Date.now() - shownAt < TAP_GUARD_MS) return;
    action();
  };

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
            <PracticeButton size="lg" onClick={guarded(onContinue)}>
              Continue
            </PracticeButton>
            <PracticeButton size="md" variant="ghost" onClick={guarded(onEnd)}>
              I&apos;m done
            </PracticeButton>
          </>
        ) : (
          <PracticeButton size="lg" onClick={guarded(onEnd)}>
            Done
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
