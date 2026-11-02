import type { ReactNode } from "react";
import {
  PracticeButton,
  type PracticeButtonProps,
} from "@/components/ui/practice-button";
import { cn } from "@/lib/utils";

/**
 * A notice that should stand out a little more than a `UserNotice` line (the
 * dashboard's and FSRS settings' account notices): a card with an emoji, a
 * bold title, a short line under it and an optional button on the side
 * (below on phones). `footer` goes under a dotted divider.
 */
export const NoticeCard = ({
  icon,
  title,
  children,
  action,
  footer,
  className,
}: {
  icon: string;
  title: ReactNode;
  children?: ReactNode;
  /** A small PracticeButton, e.g. `<NoticeCardButton>`. */
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "px-4 py-3 text-left border-2 rounded-2xl border-foreground/20 bg-muted/30",
      className
    )}
  >
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex gap-2.5 sm:flex-1">
        <span aria-hidden className="text-xl leading-6">
          {icon}
        </span>
        <div>
          <p className="text-sm font-extrabold text-foreground">{title}</p>
          {children && (
            <p className="text-sm text-muted-foreground text-pretty">
              {children}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
    {footer && (
      <div className="pt-3 mt-3 border-t border-dotted border-foreground/20">
        {footer}
      </div>
    )}
  </div>
);

/** The smaller PracticeButton a `NoticeCard` takes as its `action`. */
export const NoticeCardButton = ({
  className,
  ...props
}: PracticeButtonProps) => (
  <PracticeButton
    className={cn("h-10 px-4 text-sm shrink-0", className)}
    {...props}
  />
);
