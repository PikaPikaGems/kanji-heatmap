import { useState, type ComponentProps, type ReactNode } from "react";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeButton } from "@/components/ui/practice-button";
import { downloadBlob } from "@/lib/ai-explain/download";
import { cn } from "@/lib/utils";

/**
 * The one style for secondary AI actions: bold text, dotted underline, icon.
 * While busy it shows a spinner and a muted busyLabel, disabled.
 */
export const TextActionButton = ({
  icon,
  busy = false,
  busyLabel,
  disabled,
  children,
  className,
  ...props
}: ComponentProps<"button"> & {
  icon: ReactNode;
  busy?: boolean;
  busyLabel?: ReactNode;
}) => (
  <button
    type="button"
    {...props}
    disabled={busy || disabled}
    className={cn(
      // Like cnDottedUnderlineTrigger, but the hover highlight is enabled-only.
      "inline-flex items-center gap-1 rounded-lg px-1 leading-loose text-foreground underline decoration-dotted underline-offset-4",
      "enabled:cursor-pointer enabled:hover:bg-neon-accent enabled:hover:text-black",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
      busy && "text-muted-foreground disabled:opacity-100"
    )}
  >
    {busy ? <Loader2 size={14} className="animate-spin" /> : icon}
    <strong>{busy ? (busyLabel ?? children) : children}</strong>
  </button>
);

export const RegenerateButton = ({
  children = "Regenerate",
  busyLabel = "Regenerating…",
  ...props
}: Omit<ComponentProps<typeof TextActionButton>, "icon">) => (
  <TextActionButton
    icon={<RotateCcw size={14} />}
    busyLabel={busyLabel}
    {...props}
  >
    {children}
  </TextActionButton>
);

export const DownloadButton = ({
  children,
  ...props
}: Omit<ComponentProps<typeof TextActionButton>, "icon">) => (
  <TextActionButton icon={<Download size={14} />} {...props}>
    {children}
  </TextActionButton>
);

export const DownloadMarkdownButton = ({
  markdown,
  filename,
}: {
  markdown: string;
  filename: string;
}) => {
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col">
      <DownloadButton
        onClick={() => {
          try {
            downloadBlob(
              new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
              filename
            );
            setError("");
          } catch {
            setError("Couldn't download the Markdown. Copy it instead.");
          }
        }}
      >
        Download Markdown
      </DownloadButton>
      {error && (
        <span role="alert" className="text-xs font-bold text-destructive">
          {error}
        </span>
      )}
    </span>
  );
};

/**
 * The one style for main AI actions (Generate, Read Aloud, Download, …).
 * While busy it shows a spinner and "Generating…" (or busyLabel), disabled.
 */
export const AiPrimaryButton = ({
  className,
  busy = false,
  busyLabel = "Generating…",
  disabled,
  children,
  ...props
}: ComponentProps<typeof PracticeButton> & {
  busy?: boolean;
  busyLabel?: ReactNode;
}) => (
  <PracticeButton
    variant="primary"
    size="md"
    className={cn(
      "h-auto min-h-12 whitespace-normal px-3 py-3 text-sm sm:text-base [&_svg]:size-5",
      className
    )}
    disabled={busy || disabled}
    {...props}
  >
    {busy ? (
      <>
        <Loader2 className="animate-spin" /> {busyLabel}
      </>
    ) : (
      children
    )}
  </PracticeButton>
);

/**
 * What shows under an AI action button, in one fixed order: any live preview,
 * Cancel, the error, then the warning. The button itself shows progress.
 */
export const AiRequestFeedback = ({
  busy,
  onCancel,
  error,
  warning,
  children,
}: {
  busy: boolean;
  onCancel?: () => void;
  error?: ReactNode;
  warning?: ReactNode;
  children?: ReactNode;
}) => (
  <>
    {busy && children && (
      <div role="status" className="space-y-2">
        {children}
      </div>
    )}
    {busy && onCancel && (
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    )}
    {error && (
      <p role="alert" className="text-sm font-bold text-destructive">
        {error}
      </p>
    )}
    {warning && (
      <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
        {warning}
      </p>
    )}
  </>
);
