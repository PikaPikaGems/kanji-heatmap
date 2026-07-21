import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const OPTIONAL_SYNTAX = `:vocab[日本語]{kana="にほんご" definition="Japanese language (my own definition)"}`;

/** Shared edit-mode tips shown above the study notes textarea. */
export const StudyNotesEditorTips = forwardRef<
  HTMLDivElement,
  { className?: string }
>(function StudyNotesEditorTips({ className }, ref) {
  return (
    <div
      ref={ref}
      className={cn("text-xs leading-snug text-muted-foreground", className)}
    >
      Fun fact! Japanese text is clickable when your notes are finally
      displayed.
      <br />
      Optional Syntax:{" "}
      <code className="break-all text-[0.7rem]">{OPTIONAL_SYNTAX}</code>
    </div>
  );
});
