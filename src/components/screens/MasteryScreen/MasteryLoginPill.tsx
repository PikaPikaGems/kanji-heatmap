import { badgeCn } from "@/components/ui/badge-utils";
import { useNetworkState } from "@/hooks/use-network-state";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { cn } from "@/lib/utils";

/**
 * Logged out: a primary badge (white in dark mode, like the bottom banner it
 * replaced) floating just above the bottom-left island; tapping it opens the
 * login dialog. Hidden offline, where the app's offline banner speaks
 * instead.
 */
export const MasteryLoginPill = () => {
  const { online } = useNetworkState();
  if (!online) return null;

  return (
    <button
      type="button"
      onClick={openLoginDialog}
      className={cn(
        badgeCn,
        "fixed-viewport-layer fixed z-40 left-[calc(0.75rem+env(safe-area-inset-left))] bottom-[calc(4.25rem+env(safe-area-inset-bottom)+var(--bottom-banner-height,0px))] px-3 py-1 font-extrabold shadow-md animate-fade-in"
      )}
    >
      {/* One span, so the badge's flex layout keeps the space after "Log in". */}
      <span>
        <span className="underline underline-offset-2 decoration-2">
          Log in
        </span>{" "}
        to see mastery
      </span>
    </button>
  );
};
