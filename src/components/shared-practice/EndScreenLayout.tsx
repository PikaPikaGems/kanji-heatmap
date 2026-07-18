import { ReactNode } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { cn } from "@/lib/utils";

/**
 * Centered end-of-session layout shared by the practice modes and the
 * speed-katakana game: cheer heading + uppercase subtitle, a wrapping stat
 * row, and a stacked primary / optional ghost button column. Keyboard
 * handling and cheer selection stay with the callers.
 */
export const EndScreenLayout = ({
  heading,
  subtitle,
  headingExtra,
  stats,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  className,
}: {
  heading: string;
  subtitle: string;
  headingExtra?: ReactNode;
  stats: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center w-full h-full gap-10 animate-fade-in",
      className
    )}
  >
    <div className="text-center">
      <h2 className="text-2xl font-bold kanji-font animate-practice-bounce-soft">
        {heading}
      </h2>
      <p className="mt-1 text-xs font-bold tracking-wide uppercase text-muted-foreground">
        {subtitle}
      </p>
      {headingExtra}
    </div>

    <div className="flex flex-wrap items-center justify-center pb-4 gap-x-16 gap-y-8">
      {stats}
    </div>

    <div className="flex flex-col w-full max-w-xs gap-3">
      <PracticeButton size="lg" onClick={onPrimary}>
        {primaryLabel}
      </PracticeButton>
      {secondaryLabel && onSecondary && (
        <PracticeButton variant="ghost" size="md" onClick={onSecondary}>
          {secondaryLabel}
        </PracticeButton>
      )}
    </div>
  </div>
);
