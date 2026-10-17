import type { ReactNode } from "react";
import { User } from "lucide-react";
import { DottedSeparator } from "@/components/ui/dotted-separator";

/**
 * Sidebar account card: user icon + name (and an optional icon action on the
 * right), whatever belongs under that row (sync state, login button, notices)
 * as children, then a dotted divider and the row of icon tools (Debug Info,
 * User Preferences, FSRS settings). Logged in and logged out share it.
 */
export const AccountCard = ({
  name,
  actions,
  tools,
  children,
}: {
  name: string;
  actions?: ReactNode;
  tools: ReactNode;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-2 p-2 text-left border rounded-xl">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center min-w-0 gap-1.5 text-sm font-semibold">
        <User className="size-4 shrink-0" aria-hidden />
        <span className="truncate" title={name}>
          {name}
        </span>
      </span>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
    {children}
    <DottedSeparator className="mt-1" />
    <div className="flex items-center justify-center gap-1.5">{tools}</div>
  </div>
);
