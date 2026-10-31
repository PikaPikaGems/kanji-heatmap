import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { KanjiPopover } from "@/components/screens/FillTheKanjiScreen/KanjiPopover";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import type { PracticeWord } from "@/components/shared-practice";
import type { PracticeItem } from "../types";

/**
 * The answer word; each kanji in it opens the same kanji popover as Fill in
 * the Kanji's sentences (kana stay plain text).
 */
const AnswerWord = ({ word }: { word: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  return (
    <span className="text-4xl kanji-font" lang="ja">
      {[...word].map((char, i) => {
        const info = getKanjiInfo?.(char);
        if (!info) return <span key={i}>{char}</span>;
        return <KanjiPopover key={i} kanji={char} info={info} />;
      })}
    </span>
  );
};

/** One word: the word · reading badges · speak, then its gloss. */
const WordReveal = ({
  word,
  fallbackGloss,
}: {
  word: PracticeWord;
  fallbackGloss: string;
}) => (
  <div className="flex flex-col items-center gap-0.5">
    <div className="flex flex-wrap items-center justify-center gap-1">
      <AnswerWord word={word.word} />
      <span className="mx-1 text-base font-normal">·</span>
      {word.reading.split("・").map((r) => (
        <RomajiBadge key={r} kana={r} />
      ))}
      <SpeakButton word={word.word} iconType="volume-2" />
    </div>
    <p className="max-w-sm text-xs font-bold text-center text-muted-foreground text-pretty">
      {word.englishGloss || fallbackGloss}
    </p>
  </div>
);

/**
 * The card's words (the main one, then the secondary one when the kanji has
 * it), each with its reading badges, speak button and gloss — shared across
 * feedback drawers.
 */
export const ItemReveal = ({ item }: { item: PracticeItem }) => (
  <div className="flex flex-col items-center gap-2 text-foreground">
    <WordReveal word={item} fallbackGloss={item.keyword} />
    {item.secondary && (
      <WordReveal word={item.secondary} fallbackGloss={item.keyword} />
    )}
  </div>
);
