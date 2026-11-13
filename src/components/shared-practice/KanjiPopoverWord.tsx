import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { cn, isKanji } from "@/lib/utils";
import { KanjiPopover } from "./KanjiPopover";

/** The highlighted kanji in the full text color; the rest of the word muted. */
const highlightCn = (char: string, highlightKanji?: string | null) => {
  if (highlightKanji == null) return "";
  return char === highlightKanji ? "text-foreground" : "text-foreground/80";
};

/**
 * A word as plain text, with `highlightKanji` (the kanji the word is an
 * anchor word of) in the full text color and the rest muted.
 */
export const HighlightedWord = ({
  word,
  highlightKanji,
}: {
  word: string;
  highlightKanji?: string | null;
}) => (
  <>
    {Array.from(word).map((char, i) => (
      <span key={i} className={highlightCn(char, highlightKanji)}>
        {char}
      </span>
    ))}
  </>
);

/**
 * A word whose kanji each open their KanjiPopover, dash-underlined like the
 * kanji in Fill in the Kanji's sentences; kana stay plain text. Until the
 * kanji data loads, the word is plain text. `highlightKanji` is shown in
 * stands out, as in HighlightedWord.
 */
export const KanjiPopoverWord = ({
  word,
  kanjiClassName,
  highlightKanji,
}: {
  word: string;
  /** Extra classes on each kanji button (e.g. its padding). */
  kanjiClassName?: string;
  highlightKanji?: string | null;
}) => {
  const getInfo = useGetKanjiInfoFn();
  return (
    <>
      {Array.from(word).map((char, i) => {
        const info = isKanji(char) ? getInfo?.(char) : null;
        if (!info) {
          return (
            <span key={i} className={highlightCn(char, highlightKanji)}>
              {char}
            </span>
          );
        }
        return (
          <KanjiPopover
            key={i}
            kanji={char}
            info={info}
            className={cn(
              "underline decoration-dashed decoration-[3px] underline-offset-[0.2em] decoration-foreground/30 hover:decoration-foreground hover:decoration-solid",
              highlightCn(char, highlightKanji),
              kanjiClassName
            )}
          />
        );
      })}
    </>
  );
};
