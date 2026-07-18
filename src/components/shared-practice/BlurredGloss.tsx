import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * English-gloss text that starts blurred and reveals on tap. Owns the toggle
 * state and re-applies the initial blur whenever `resetKey` changes (e.g. the
 * card index). When `blurrable` is false it renders as plain, non-interactive
 * text; `forceReveal` un-blurs regardless of the toggle (e.g. answer revealed).
 */
export const BlurredGloss = ({
  text,
  resetKey,
  blurrable = true,
  forceReveal = false,
  className,
}: {
  text: string;
  resetKey: unknown;
  blurrable?: boolean;
  forceReveal?: boolean;
  className?: string;
}) => {
  const [blurred, setBlurred] = useState(blurrable);

  // Re-apply the initial blur when the card (resetKey) or blurrable changes —
  // done during render (React's previous-state pattern) instead of an effect,
  // so there is no one-frame flash of the previous card's revealed state.
  const [prevReset, setPrevReset] = useState({ resetKey, blurrable });
  if (prevReset.resetKey !== resetKey || prevReset.blurrable !== blurrable) {
    setPrevReset({ resetKey, blurrable });
    setBlurred(blurrable);
  }

  const gloss = text || "—";
  const base = "max-w-sm px-2 text-xs font-bold tracking-wide";

  if (!blurrable) {
    return <p className={cn(base, className)}>{gloss}</p>;
  }

  const isBlurred = blurred && !forceReveal;
  return (
    <button
      type="button"
      className={cn(
        base,
        "transition-all outline-none",
        isBlurred && "blur-[5px] hover:blur-none",
        className
      )}
      onClick={() => setBlurred((v) => !v)}
      aria-label={isBlurred ? "Reveal English gloss" : "Blur English gloss"}
    >
      {gloss}
    </button>
  );
};
