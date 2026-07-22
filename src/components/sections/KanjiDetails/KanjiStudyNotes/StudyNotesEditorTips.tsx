import { Button } from "@/components/ui/button";
import { CheckCircle, Clipboard } from "@/components/icons";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

export const OPTIONAL_VOCAB_SYNTAX = `:vocab[日本]{kana="にほん" definition="Japan"}`;

const VocabSyntaxCopyButton = () => {
  const { copy, status } = useCopyToClipboard(1200);
  const copied = status === "copied";

  return (
    <Button
      type="button"
      variant="outline"
      size="iconXl"
      className="rounded-md h-7 w-7 shrink-0"
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
export const StudyNotesEditorTips = ({ className }: { className?: string }) => {
  return (
    <div className={cn("space-y-2.5 text-sm font-bold text-left", className)}>
      <p>
        Fun fact! Japanese text is clickable when your notes are finally
        displayed. Try the optional syntax! 👇
      </p>

      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5 rounded-lg border border-border/70 bg-muted/50 p-1.5 pl-2.5">
          <code className="flex-1 min-w-0 font-mono text-sm leading-relaxed text-left break-all text-foreground/80">
            {OPTIONAL_VOCAB_SYNTAX}
          </code>
          <VocabSyntaxCopyButton />
        </div>
      </div>
    </div>
  );
};
