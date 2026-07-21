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
  "font-mono text-sm font-normal not-italic leading-[1.55rem] tracking-normal",
  "text-left whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
  "border-0"
);

interface MarkdownEditorProps {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}

export const MarkdownEditor = ({
  value,
  maxLength,
  onChange,
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
    <div>
      {/* No padding here — absolute backdrop + flowing textarea must share the same origin. */}
      <div className="relative overflow-hidden bg-background rounded-xl border-[3px] border-dotted border-border focus-within:border-ring focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
        <pre
          ref={backdropRef}
          aria-hidden="true"
          className={cn(
            sharedEditorTextClass,
            "absolute inset-0 overflow-hidden pointer-events-none"
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
          placeholder="Write Markdown notes here. Japanese texts are clickable in View Mode."
          className={cn(
            sharedEditorTextClass,
            "relative block w-full h-64 resize-none bg-transparent outline-none",
            // Glyphs stay invisible so only the backdrop colors show; caret stays visible.
            "text-transparent caret-foreground [-webkit-text-fill-color:transparent]",
            // Translucent wash (not opaque lime) so backdrop text stays readable.
            // Also beat global `::selection { color: black !important }`.
            "selection:!bg-[rgb(127_255_0_/_0.25)] selection:!text-transparent",
            "selection:[-webkit-text-fill-color:transparent]"
            // "placeholder:text-muted-foreground placeholder:[-webkit-text-fill-color:unset]"
          )}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncScroll}
        />
      </div>
      <p
        className={`mt-1.5 text-xs text-right font-bold ${value.length >= maxLength ? "text-red-500" : "text-muted-foreground"}`}
        aria-live="polite"
      >
        {value.length} / {maxLength}
      </p>
    </div>
  );
};
