import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { cn, isKanji } from "@/lib/utils";
import { KanjiPopover } from "./KanjiPopover";

/**
 * A word whose kanji each open their KanjiPopover, dash-underlined like the
 * kanji in Fill in the Kanji's sentences; kana stay plain text. Until the
 * kanji data loads, the word is plain text.
 */
export const KanjiPopoverWord = ({
  word,
  kanjiClassName,
}: {
  word: string;
  /** Extra classes on each kanji button (e.g. its padding). */
  kanjiClassName?: string;
}) => {
  const getInfo = useGetKanjiInfoFn();
  return (
    <>
      {Array.from(word).map((char, i) => {
        const info = isKanji(char) ? getInfo?.(char) : null;
        if (!info) return <span key={i}>{char}</span>;
        return (
          <KanjiPopover
            key={i}
            kanji={char}
            info={info}
            className={cn(
              "underline decoration-dashed decoration-2 underline-offset-[0.12em] decoration-foreground/30 hover:decoration-foreground hover:decoration-solid",
              kanjiClassName
            )}
          />
        );
      })}
    </>
  );
};
