import { FlashState } from "./use-speed-katakana-game";

/**
 * The brief ✓/→ english-gloss reveal after answering or skipping a word.
 * Keyed so the CSS animation restarts on rapid consecutive answers.
 */
export const FlashFeedback = ({ flash }: { flash: FlashState | null }) => (
  <div className="h-4">
    {flash && (
      <span
        key={flash.key}
        className={`text-xs font-bold tracking-wide uppercase animate-english-flash ${flash.skipped ? "text-muted-foreground" : "text-green-500"}`}
      >
        {flash.skipped ? "→" : "✓"} {flash.english}
      </span>
    )}
  </div>
);
