import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clipboard } from "@/components/icons";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

export const OPTIONAL_VOCAB_SYNTAX = `:vocab[日本語]{kana="にほんご" definition="Japanese language (my own definition)"}`;

const VocabSyntaxCopyButton = () => {
  const { copy, status } = useCopyToClipboard(1200);
  const copied = status === "copied";

  return (
    <Button
      type="button"
      variant="outline"
      size="iconXl"
      className="h-7 w-7 shrink-0 rounded-md"
      aria-label={copied ? "Copied vocab syntax" : "Copy vocab syntax"}
      title={copied ? "Copied" : "Copy"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void copy(OPTIONAL_VOCAB_SYNTAX, event);
      }}
    >
      {copied ? (
        <CheckCircle className="size-3.5" />
      ) : (
        <Clipboard className="size-3.5" />
      )}
    </Button>
  );
};

/** Shared edit-mode tips shown above the study notes textarea. */
export const StudyNotesEditorTips = forwardRef<
  HTMLDivElement,
  { className?: string }
>(function StudyNotesEditorTips({ className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "space-y-2.5 text-xs leading-snug text-muted-foreground",
        className
      )}
    >
      <p>
        Fun fact! Japanese text is clickable when your notes are finally
        displayed.
      </p>

      <div className="space-y-1.5">
        <p className="font-medium text-foreground/80">Optional syntax</p>
        <div className="flex items-start gap-1.5 rounded-lg border border-border/70 bg-muted/50 p-1.5 pl-2.5">
          <code className="min-w-0 flex-1 break-all font-mono text-[0.7rem] leading-relaxed text-foreground/90">
            {OPTIONAL_VOCAB_SYNTAX}
          </code>
          <VocabSyntaxCopyButton />
        </div>
      </div>
    </div>
  );
});
