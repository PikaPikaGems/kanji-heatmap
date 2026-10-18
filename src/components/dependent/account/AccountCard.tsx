import type { ReactNode } from "react";
import { User } from "lucide-react";
import { DottedSeparator } from "@/components/ui/dotted-separator";

/** Round avatar: the email's first letter when logged in, else a user icon. */
const Avatar = ({ initial }: { initial: string | null }) =>
  initial ? (
    <span
      aria-hidden
      className="flex items-center justify-center text-base font-extrabold text-white rounded-full size-10 shrink-0 background-theme-color-with-opacity-100"
    >
      {initial}
    </span>
  ) : (
    <span
      aria-hidden
      className="flex items-center justify-center border-2 border-dashed rounded-full size-10 shrink-0 text-muted-foreground"
    >
      <User className="size-5" />
    </span>
  );

/**
 * Sidebar account card: an avatar, the name with a status line under it
 * (sync state, or "Not logged in") and an optional icon action on the right;
 * whatever belongs under that row (login button, sync problems, notices) as
 * children; then a dotted divider and the row of icon tools (Debug Info,
 * User Preferences, FSRS settings). Logged in and logged out share it.
 */
export const AccountCard = ({
  name,
  initial = null,
  status,
  actions,
  tools,
  children,
}: {
  name: string;
  /** Letter for the avatar; null shows the guest icon. */
  initial?: string | null;
  /** One small line under the name. */
  status: ReactNode;
  actions?: ReactNode;
  tools: ReactNode;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-3 p-3 text-left border rounded-xl">
    <div className="flex items-center gap-3">
      <Avatar initial={initial} />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-bold truncate" title={name}>
          {name}
        </span>
        {status}
      </div>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
    {children}
    <DottedSeparator />
    <div className="flex items-center justify-center gap-1.5">{tools}</div>
  </div>
);
