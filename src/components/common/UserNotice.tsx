import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A message the user should read (not logged in, read-only note, unsaved
 * draft): a leading emoji and text in the normal text color, never muted.
 * Actions go inline as `NoticeAction`s, not as separate buttons.
 */
export const UserNotice = ({
  children,
  icon = "⚠️",
  className,
}: {
  children: ReactNode;
  /** Leading emoji; pass null for none. */
  icon?: string | null;
  className?: string;
}) => (
  <p className={cn("text-sm text-left text-foreground text-pretty", className)}>
    {icon ? (
      <span aria-hidden className="mr-1.5">
        {icon}
      </span>
    ) : null}
    {children}
  </p>
);

/** An underlined text button inside a `UserNotice` ("Log in", "discard"). */
export const NoticeAction = ({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="font-bold underline rounded-sm underline-offset-4 decoration-2 hover-text-theme-color-with-opacity-100 disabled:opacity-50 disabled:no-underline"
  >
    {children}
  </button>
);
