import { useMemo, useRef, type UIEvent } from "react";
import { cn } from "@/lib/utils";
import {
  getMarkdownHighlightSegments,
  type MarkdownHighlightKind,
} from "./markdown";

const highlightClasses: Record<MarkdownHighlightKind, string> = {
  plain: "text-foreground",
  heading: "font-semibold text-primary",
  emphasis: "text-fuchsia-600 dark:text-fuchsia-400",
  link: "text-blue-600 underline dark:text-blue-400",
  quote: "italic text-muted-foreground",
  list: "text-amber-700 dark:text-amber-400",
  code: "text-emerald-700 dark:text-emerald-400",
  directive: "text-violet-700 dark:text-violet-400",
};

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
      <div className="relative overflow-hidden border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <pre
          ref={backdropRef}
          aria-hidden="true"
          className="absolute inset-0 p-3 m-0 overflow-hidden font-mono text-sm leading-6 text-left break-words whitespace-pre-wrap pointer-events-none"
        >
          {segments.map((segment, index) => (
            <span
              key={`${segment.kind}-${index}`}
              className={cn(highlightClasses[segment.kind])}
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
          placeholder={`Write Markdown notes here. When you write Japanese words like 自転車 they become clickable on when displayed!`}
          className="relative block w-full p-3 overflow-auto font-mono text-sm leading-6 text-left text-transparent bg-transparent border-0 resize-y min-h-48 caret-foreground placeholder:text-muted-foreground focus:outline-none"
          style={{ caretColor: "hsl(var(--foreground))" }}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncScroll}
        />
      </div>
      <p
        className="mt-1 text-xs text-right text-muted-foreground"
        aria-live="polite"
      >
        {value.length}/{maxLength}
      </p>
    </div>
  );
};
