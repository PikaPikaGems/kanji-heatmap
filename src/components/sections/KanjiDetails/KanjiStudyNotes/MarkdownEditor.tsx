import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { EDITOR_HIGHLIGHT_CLASSES } from "./editorHighlightClasses";
import { getMarkdownHighlightSegments } from "./markdown";

/**
 * Typography must match exactly on the backdrop and textarea — any padding,
 * size, kerning, or wrapping mismatch shifts caret/selection relative to the
 * highlights. Bold/italic highlight spans are metric-safe: the mono stack is
 * fixed-pitch across weights/slants, CJK fallback glyphs are full-width, and
 * `font-synthesis: none` (set at :root) prevents synthetic faces from
 * changing advance widths.
 */
const sharedEditorTextClass = cn(
  "m-0 box-border appearance-none rounded-none p-3.5",
  "font-mono text-base font-normal not-italic leading-[1.55rem] tracking-normal",
  "[font-kerning:none] [font-variant-ligatures:none]",
  "text-left whitespace-pre-wrap break-words",
  "[-webkit-text-size-adjust:100%] [text-size-adjust:100%]",
  "border-0"
);

/** iOS-family WebKit (Safari + every iOS browser shell). Desktop stays out. */
const isIOSLikeWebKit =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("-webkit-touch-callout", "none");

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollSyncRafRef = useRef<number | null>(null);
  const segments = useMemo(() => getMarkdownHighlightSegments(value), [value]);

  const syncScrollNow = () => {
    const backdrop = backdropRef.current;
    const textarea = textareaRef.current;
    if (backdrop == null || textarea == null) {
      return;
    }
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  };

  /**
   * iOS WebKit auto-scrolls a focused textarea (paste, typing near the
   * bottom, caret moves) without reliably firing scroll events, which leaves
   * the highlight backdrop vertically offset from the caret. While focused,
   * mirror the scroll position every frame instead of trusting events.
   */
  const startScrollSyncLoop = () => {
    if (!isIOSLikeWebKit || scrollSyncRafRef.current != null) {
      return;
    }
    const tick = () => {
      syncScrollNow();
      scrollSyncRafRef.current = requestAnimationFrame(tick);
    };
    scrollSyncRafRef.current = requestAnimationFrame(tick);
  };

  const stopScrollSyncLoop = () => {
    if (scrollSyncRafRef.current != null) {
      cancelAnimationFrame(scrollSyncRafRef.current);
      scrollSyncRafRef.current = null;
    }
  };

  // Effect needed: the rAF loop is an imperative subscription that must be
  // cancelled on unmount (blur never fires if the dialog unmounts while
  // focused); there is no render-time way to express that cleanup.
  useEffect(() => stopScrollSyncLoop, []);

  /**
   * WebKit can leave the textarea's glyph layout stale after edits near a
   * wrap boundary (caret and wrapping desync from the overlay; WebKit-only).
   * Toggling letter-spacing with a forced reflow invalidates the stale
   * shaping cache. See https://github.com/panphora/overtype/issues/116.
   */
  const nudgeGlyphLayout = () => {
    const textarea = textareaRef.current;
    if (textarea == null) {
      return;
    }
    textarea.style.setProperty("letter-spacing", "-0.001px", "important");
    void textarea.offsetHeight;
    textarea.style.removeProperty("letter-spacing");
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
          ref={textareaRef}
          aria-label="Kanji study notes Markdown"
          value={value}
          maxLength={maxLength}
          rows={8}
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="Write your notes here. Markdown is supported. Fun fact! Japanese texts (e.g. 日本語, にほんご) are clickable when your notes are finally displayed."
          className={cn(
            sharedEditorTextClass,
            "relative block w-full resize-none bg-transparent outline-none",
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
          onChange={(event) => {
            onChange(event.target.value);
            if (isIOSLikeWebKit) {
              requestAnimationFrame(() => {
                nudgeGlyphLayout();
                syncScrollNow();
              });
            }
          }}
          onScroll={syncScrollNow}
          onFocus={startScrollSyncLoop}
          onBlur={stopScrollSyncLoop}
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
