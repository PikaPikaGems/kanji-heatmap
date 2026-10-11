import { useState } from "react";
import { cn } from "@/lib/utils";
import { parseBunsetsu, Puzzle } from "@/lib/fill-the-kanji/puzzle";

/** Bunsetsu laid out with a visible gap between them, wrapping as needed. */
const bunsetsuRowCn =
  "kanji-font flex flex-wrap items-center justify-center gap-x-[0.45em] gap-y-[0.35em]";

/** The full answer sentence with furigana over every reading. */
export const FuriganaSentence = ({
  jp,
  className,
}: {
  jp: string;
  className?: string;
}) => (
  // Baseline, not center: a bunsetsu with furigana is taller, and centering
  // would lift the ones without it (ゴミを sat higher than 分ける).
  // Leading goes after `className`: its text-2xl/text-3xl would otherwise
  // drop it (twMerge), leaving a fixed line-height that is too tall on phones.
  // Unitless 1.6 keeps wrapped lines close (furigana still clears the line
  // above); sm+ keeps 2.25rem.
  <p
    className={cn(
      bunsetsuRowCn,
      "items-baseline",
      className,
      "leading-[1.6] sm:leading-[2.25rem]"
    )}
    lang="ja"
  >
    {parseBunsetsu(jp).map((parts, i) => (
      <span key={i}>
        {parts.map(([text, reading], j) =>
          reading ? (
            <ruby key={j}>
              {text}
              <rp>(</rp>
              <rt className="text-[0.45em] font-normal text-muted-foreground pb-[0.6em]">
                {reading}
              </rt>
              <rp>)</rp>
            </ruby>
          ) : (
            <span key={j}>{text}</span>
          )
        )}
      </span>
    ))}
  </p>
);

/** Smaller text for longer sentences, so they don't push the tiles off-screen. */
const promptSizeCn = (length: number) => {
  if (length > 60) return "text-xl sm:text-3xl";
  if (length > 30) return "text-2xl sm:text-4xl";
  return "text-3xl sm:text-5xl";
};

export type BlankState = "empty" | "filled" | "current" | "right" | "wrong";

/** Same ring as focused input fields (ui/input.tsx). */
const inputLikeRingCn = "ring-2 ring-ring ring-offset-2 ring-offset-background";

const blankCn: Record<BlankState, string> = {
  empty: "border-dotted border-foreground/60 text-muted-foreground",
  filled: "border-dotted border-foreground/40",
  current: cn("border-dotted border-foreground", inputLikeRingCn),
  right:
    "border-dotted border-green-500 bg-green-500/15 animate-practice-correct-pop",
  wrong: "border-dotted border-red-500 bg-red-500/15 animate-practice-shake",
};

/** Delay between neighbouring blanks' correct-answer pop (a ripple). */
const WOBBLE_STAGGER_MS = 70;

const BlankButton = ({
  blank,
  value,
  state,
  disabled,
  onClick,
}: {
  blank: number;
  value: string | null;
  state: BlankState;
  disabled: boolean;
  onClick: () => void;
}) => {
  // Keep a removed kanji on screen while it fades out (previous-state
  // pattern: no effect, cleared when its animation ends).
  const [prevValue, setPrevValue] = useState(value);
  const [leaving, setLeaving] = useState<string | null>(null);
  if (prevValue !== value) {
    setPrevValue(value);
    setLeaving(value == null ? prevValue : null);
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={value ? `Blank filled with ${value}` : "Empty blank"}
      style={
        state === "right"
          ? { animationDelay: `${blank * WOBBLE_STAGGER_MS}ms` }
          : undefined
      }
      className={cn(
        "inline-flex items-center justify-center mx-[0.2em] min-w-[1.45em] h-[1.55em] px-[0.12em] rounded-xl border-[3px] leading-none align-middle transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-default enabled:hover:bg-accent",
        blankCn[state]
      )}
    >
      {value ? (
        // Keyed by value so each newly placed kanji lands again.
        <span key={value} className="animate-practice-fill-land">
          {value}
        </span>
      ) : leaving ? (
        <span
          key={`leaving-${leaving}`}
          className="animate-practice-fade-out"
          onAnimationEnd={() => setLeaving(null)}
        >
          {leaving}
        </span>
      ) : (
        <span className="text-[0.55em] font-extrabold">?</span>
      )}
    </button>
  );
};

/**
 * The sentence with blanks, bunsetsu spaced apart. Blanks are buttons:
 * tapping one selects it (and clears it, so the next tile goes there).
 * Furigana is never shown here. `revealed` colors each blank right / wrong.
 */
export const SentencePrompt = ({
  puzzle,
  filled,
  cursor,
  revealed,
  onBlankClick,
}: {
  puzzle: Puzzle;
  filled: (string | null)[];
  cursor: number | null;
  revealed: boolean;
  onBlankClick: (blank: number) => void;
}) => {
  const blankState = (blank: number): BlankState => {
    const value = filled[blank];
    if (revealed) return value === puzzle.blanks[blank] ? "right" : "wrong";
    if (blank === cursor) return "current";
    return value == null ? "empty" : "filled";
  };

  const length = puzzle.bunsetsu
    .flat()
    .reduce((n, segment) => n + segment.chars.length, 0);

  return (
    <p
      className={cn(bunsetsuRowCn, "leading-tight", promptSizeCn(length))}
      lang="ja"
    >
      {puzzle.bunsetsu.map((segments, i) => (
        <span key={i} className="inline-flex flex-wrap items-center">
          {segments.flatMap((segment, j) =>
            segment.chars.map(({ char, blank }, k) =>
              blank == null ? (
                <span key={`${j}-${k}`}>{char}</span>
              ) : (
                <BlankButton
                  key={`${j}-${k}`}
                  blank={blank}
                  value={filled[blank]}
                  state={blankState(blank)}
                  disabled={revealed}
                  onClick={() => onBlankClick(blank)}
                />
              )
            )
          )}
        </span>
      ))}
    </p>
  );
};
