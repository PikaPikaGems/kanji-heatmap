import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAccountStatus } from "@/lib/engine/use-account-status";

const SIGNED_OUT_COPY = "⚠️ Progress not saved — you're not logged in";
const BROWSER_COPY = "⚠️ Progress can't be saved in this browser";

const Notice = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <p className={cn("text-xs text-center text-muted-foreground", className)}>
    {children}
  </p>
);

/**
 * End-of-round line for games that save progress to the account. Says why
 * nothing was saved (logged out, or a browser that can't save), or shows
 * `saveError` when the account is active but the write failed. Renders
 * nothing when all is well or when this build has no accounts.
 */
export const ProgressNotSavedNotice = ({
  saveError,
  className,
}: {
  /** Copy for the failed write, from copyForCode(). */
  saveError?: string | null;
  className?: string;
}) => {
  const account = useAccountStatus();

  if (account.kind === "signed-out") {
    return <Notice className={className}>{SIGNED_OUT_COPY}</Notice>;
  }
  if (account.kind === "unavailable" && account.reason !== "not-included") {
    return <Notice className={className}>{BROWSER_COPY}</Notice>;
  }
  if (account.kind === "active" && saveError) {
    return <Notice className={className}>{saveError}</Notice>;
  }
  return null;
};
