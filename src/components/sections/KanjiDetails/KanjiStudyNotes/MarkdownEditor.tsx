import { useMemo, useRef, type UIEvent } from "react";
import { cn } from "@/lib/utils";
import { EDITOR_HIGHLIGHT_CLASSES } from "./editorHighlightClasses";
import { getMarkdownHighlightSegments } from "./markdown";

/**
 * Typography must match exactly on the backdrop and textarea — any padding,
 * weight, or italic mismatch shifts caret/selection relative to the highlights.
 */
const sharedEditorTextClass = cn(
  "m-0 box-border p-3.5",
  "font-mono text-base font-normal not-italic leading-[1.55rem] tracking-normal",
  "text-left whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
  "border-0"
);

interface MarkdownEditorProps {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  /** Grow to fill the parent instead of a fixed h-64. */
  fill?: boolean;
  autoFocus?: boolean;
}

export const MarkdownEditor = ({
  value,
  maxLength,
  onChange,
  fill = false,
  autoFocus = false,
}: MarkdownEditorProps) => {
  const backdropRef = useRef<HTMLPreElement>(null);
  const segments = useMemo(() => getMarkdownHighlightSegments(value), [value]);

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current == null) {
      return;
    }
    backdropRef.current.scrollTop = event.currentTarget.scrollTop;
    backdropRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className={cn(fill && "flex h-full min-h-0 flex-col")}>
      {/* No padding here — absolute backdrop + flowing textarea must share the same origin. */}
      <div
        className={cn(
          "relative overflow-hidden bg-background rounded-xl border-[3px] border-dotted border-border focus-within:border-ring focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
          fill && "min-h-0 flex-1"
        )}
      >
        <pre
          ref={backdropRef}
          aria-hidden="true"
          className={cn(
            sharedEditorTextClass,
            "markdown-editor-backdrop absolute inset-0 overflow-hidden pointer-events-none"
          )}
        >
          {segments.map((segment, index) => (
            <span
              key={`${segment.kind}-${index}`}
              className={cn(EDITOR_HIGHLIGHT_CLASSES[segment.kind])}
            >
              {segment.text}
            </span>
          ))}
          {"\n"}
        </pre>
        <textarea
          aria-label="Kanji study notes Markdown"
          value={value}
          maxLength={maxLength}
          rows={8}
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="Write your notes here. Markdown is supported. Fun fact! Japanese texts (e.g. 日本語, にほんご) are clickable when your notes are finally displayed."
          className={cn(
            sharedEditorTextClass,
            "markdown-editor-input relative block w-full resize-none bg-transparent outline-none",
            fill ? "h-full min-h-0" : "h-64",
            // Glyphs stay invisible so only the backdrop colors show; caret stays visible.
            "text-transparent caret-foreground [-webkit-text-fill-color:transparent]",
            // Translucent wash (not opaque lime) so backdrop text stays readable.
            // Also beat global `::selection { color: black !important }`.
            "selection:!bg-[rgb(127_255_0_/_0.25)] selection:!text-transparent",
            "selection:[-webkit-text-fill-color:transparent]",
            // Explicit fill (not unset) — unset inherits the parent's transparent fill.
            "placeholder:text-muted-foreground placeholder:[-webkit-text-fill-color:hsl(var(--muted-foreground))]"
          )}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncScroll}
        />
      </div>
      <p
        className={`mt-1.5 shrink-0 text-xs text-right font-bold ${value.length >= maxLength ? "text-red-500" : "text-muted-foreground"}`}
        aria-live="polite"
      >
        {value.length} / {maxLength}
      </p>
    </div>
  );
};
