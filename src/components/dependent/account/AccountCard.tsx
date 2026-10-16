import type { ReactNode } from "react";
import { User } from "lucide-react";

/**
 * Sidebar account card: user icon + name on the left, icon actions on the
 * right, and whatever belongs under that row (sync state, login button,
 * notices) as children. Logged in and logged out share it.
 */
export const AccountCard = ({
  name,
  actions,
  children,
}: {
  name: string;
  actions: ReactNode;
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
      <div className="flex items-center gap-1.5">{actions}</div>
    </div>
    {children}
  </div>
);
