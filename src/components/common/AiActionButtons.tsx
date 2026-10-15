import { useState, type ComponentProps, type ReactNode } from "react";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeButton } from "@/components/ui/practice-button";
import { downloadBlob } from "@/lib/ai-explain/download";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/** The one style for secondary AI actions: bold text, dotted underline, icon. */
export const TextActionButton = ({
  icon,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { icon: ReactNode }) => (
  <button
    type="button"
    {...props}
    className={cn(cnDottedUnderlineTrigger, "disabled:opacity-50", className)}
  >
    {icon}
    <strong>{children}</strong>
  </button>
);

/** While busy it shows a spinner and a muted "Regenerating…" label, disabled. */
export const RegenerateButton = ({
  children = "Regenerate",
  busy = false,
  busyLabel = "Regenerating…",
  disabled,
  className,
  ...props
}: Omit<ComponentProps<typeof TextActionButton>, "icon"> & {
  busy?: boolean;
  busyLabel?: ReactNode;
}) => (
  <TextActionButton
    icon={
      busy ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <RotateCcw size={14} />
      )
    }
    disabled={busy || disabled}
    className={cn(
      busy &&
        "cursor-default text-muted-foreground hover:bg-transparent hover:text-muted-foreground disabled:opacity-100",
      className
    )}
    {...props}
  >
    {busy ? busyLabel : children}
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

/** The one style for the main AI action (Generate, Read Aloud, …). */
export const AiPrimaryButton = ({
  className,
  ...props
}: ComponentProps<typeof PracticeButton>) => (
  <PracticeButton
    variant="primary"
    size="md"
    className={cn(
      "h-auto min-h-12 whitespace-normal px-3 py-3 text-sm sm:text-base",
      className
    )}
    {...props}
  />
);

/**
 * What shows under an AI action button, in one fixed order: the in-progress
 * status (plus any live preview), Cancel, the error, then the warning. Omit
 * busyLabel when a RegenerateButton already shows the progress.
 */
export const AiRequestFeedback = ({
  busy,
  busyLabel,
  onCancel,
  error,
  warning,
  children,
}: {
  busy: boolean;
  busyLabel?: string;
  onCancel?: () => void;
  error?: ReactNode;
  warning?: ReactNode;
  children?: ReactNode;
}) => (
  <>
    {busy && (
      <div role="status" className="space-y-2">
        {busyLabel && (
          <p className="flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> {busyLabel}
          </p>
        )}
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
