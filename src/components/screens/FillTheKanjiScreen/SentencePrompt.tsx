import { useState } from "react";
import { cn, isKanji } from "@/lib/utils";
import { parseBunsetsu, Puzzle } from "@/lib/fill-the-kanji/puzzle";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { KanjiPopover } from "@/components/shared-practice/KanjiPopover";
import { BLANK_BOX_CN, blankCn, type BlankState } from "./blank-cn";

/** Bunsetsu laid out with a visible gap between them, wrapping as needed. */
const bunsetsuRowCn =
  "kanji-font flex flex-wrap items-center justify-center gap-x-[0.45em] gap-y-[0.35em]";

/** Right or wrong, per blank in reading order (left empty counts as wrong). */
export type BlankResult = "right" | "wrong";

// inline-block: transforms (the hop and the shake) don't apply to inline text.
// Wrong is yellow, not red: the drawer shows the correct kanji there.
const blankResultCn: Record<BlankResult, string> = {
  right: "inline-block text-green-500 animate-practice-correct-pop",
  wrong:
    "inline-block text-yellow-600 dark:text-yellow-400 animate-practice-shake",
};

/** Delay between neighbouring blanks' correct-answer pop (a ripple). */
const WOBBLE_STAGGER_MS = 70;

/** Lets the drawer finish sliding up before the first kanji hops. */
const ANSWER_ANIMATION_DELAY_MS = 250;

/** Right kanji hop one after another, like the blanks do on the question screen. */
const hopDelayStyle = (
  result: BlankResult | undefined,
  blank: number | null
) =>
  result === "right" && blank != null
    ? {
        animationDelay: `${ANSWER_ANIMATION_DELAY_MS + blank * WOBBLE_STAGGER_MS}ms`,
      }
    : undefined;

/**
 * The full answer sentence with furigana over every reading. With a `puzzle`
 * and `blankResults`, the blanked kanji are colored by how they were answered.
 */
export const FuriganaSentence = ({
  jp,
  puzzle,
  blankResults,
  getInfo,
  className,
}: {
  jp: string;
  puzzle?: Puzzle;
  blankResults?: BlankResult[];
  /** When given, each kanji opens a popover showing it large with its keyword and levels. */
  getInfo?: GetBasicKanjiInfo;
  className?: string;
}) => {
  const bunsetsu =
    puzzle?.bunsetsu ??
    parseBunsetsu(jp).map((parts) =>
      parts.map(([text, reading]) => ({
        reading,
        chars: Array.from(text).map((char) => ({ char, blank: null })),
      }))
    );
  return (
    // Baseline, not center: a bunsetsu with furigana is taller, and centering
    // would lift the ones without it (ゴミを sat higher than 分ける).
    // Leading goes after `className`: its text-2xl/text-3xl would otherwise
    // drop it (twMerge), leaving a fixed line-height that is too tall on phones.
    // Unitless 1.3 keeps wrapped lines close (furigana still clears the line
    // above). The reading's negative bottom margin pulls it into the line's
    // half-leading, so it sits close to its kanji.
    // Row gap is small: the reading's own height already separates lines.
    <p
      className={cn(
        bunsetsuRowCn,
        "items-baseline gap-y-[0.1em] [overflow-wrap:anywhere]",
        className,
        "leading-[1.3]"
      )}
      lang="ja"
    >
      {bunsetsu.map((parts, i) => (
        // min-w-0 + max-w-full: a long bunsetsu wraps inside its own box
        // instead of widening the row (on iOS it widened the whole drawer).
        <span key={i} className="max-w-full min-w-0">
          {parts.map(({ reading, chars }, j) => {
            const text = chars.map(({ char, blank }, k) => {
              const result = blank == null ? undefined : blankResults?.[blank];
              const color = result && blankResultCn[result];
              const info = isKanji(char) ? getInfo?.(char) : null;
              if (info) {
                return (
                  <KanjiPopover
                    key={k}
                    kanji={char}
                    info={info}
                    className={`${color} underline underline-offset-8 decoration-dashed decoration-foreground/10 hover:decoration-foreground hover:decoration-solid`}
                    style={hopDelayStyle(result, blank)}
                  />
                );
              }
              if (!color) return char;
              return (
                <span
                  key={k}
                  className={color}
                  style={hopDelayStyle(result, blank)}
                >
                  {char}
                </span>
              );
            });
            if (!reading) return <span key={j}>{text}</span>;
            // The reading is absolutely centered over its kanji
            // (left-1/2 + -translate-x-1/2 needs no intrinsic sizing). The
            // top padding reserves its height minus the 0.1em it dips into the
            // line's half-leading, leaving a small gap above the kanji; the min width (0.45em per kana) keeps a
            // long reading from running over its neighbours. The baseline is
            // still the kanji's.
            return (
              <span
                key={j}
                className="relative inline-block pt-[0.35em] text-center"
                style={{ minWidth: `${Array.from(reading).length * 0.45}em` }}
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[0.45em] font-normal text-muted-foreground leading-none whitespace-nowrap">
                  {reading}
                </span>
                {text}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
};

/** Smaller text for longer sentences, so they don't push the tiles off-screen. */
const promptSizeCn = (length: number) => {
  if (length > 60) return "text-xl sm:text-3xl";
  if (length > 30) return "text-2xl sm:text-4xl";
  return "text-3xl sm:text-5xl";
};

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
        BLANK_BOX_CN,
        "transition-colors",
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
