import type { ReactNode } from "react";
import { User } from "lucide-react";
import { DottedSeparator } from "@/components/ui/dotted-separator";
import { PracticeButton } from "@/components/ui/practice-button";
import { HintChip } from "@/components/common/HintChip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useDebugReport } from "@/hooks/use-debug-report";
import { useFlashHint } from "@/hooks/use-flash-hint";
import { cn } from "@/lib/utils";

/**
 * The logged-in avatar: a round FAB-style button with the email's first
 * letter. Tapping it copies the App & Device Info report, with a little
 * celebration and a "Debug info copied" chip.
 */
const AvatarButton = ({ initial }: { initial: string }) => {
  const { text } = useDebugReport();
  const { copy } = useCopyToClipboard();
  const hint = useFlashHint();

  return (
    <span className="relative shrink-0">
      <PracticeButton
        size="icon"
        className={cn(
          "rounded-full size-11 border-b-4 active:border-b-2 text-lg font-extrabold",
          hint.hint && "animate-practice-bounce-soft"
        )}
        aria-label="Copy debug info"
        title="Copy debug info"
        onClick={(e) => {
          void copy(text, e);
          hint.show("Debug info copied 🎉");
        }}
      >
        {initial}
      </PracticeButton>
      {hint.hint && (
        <HintChip
          key={hint.hint.key}
          className="left-0 -bottom-7"
          onDone={hint.done}
        >
          {hint.hint.text}
        </HintChip>
      )}
    </span>
  );
};

/** Round avatar: the copy button when logged in, else a user icon. */
const Avatar = ({ initial }: { initial: string | null }) =>
  initial ? (
    <AvatarButton initial={initial} />
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
 * children; then a dotted divider and the row of icon tools (App & Device Info,
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
