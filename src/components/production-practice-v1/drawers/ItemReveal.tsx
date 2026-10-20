import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { KanjiPopover } from "@/components/screens/FillTheKanjiScreen/KanjiPopover";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
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

/** Word · reading badges · speak · gloss — shared across feedback drawers. */
export const ItemReveal = ({ item }: { item: PracticeItem }) => (
  <div className="flex flex-col items-center gap-1 text-foreground">
    <div className="flex flex-wrap items-center justify-center gap-1">
      <AnswerWord word={item.word} />
      <span className="mx-1 text-base font-normal">·</span>
      {item.reading.split("・").map((r) => (
        <RomajiBadge key={r} kana={r} />
      ))}
      <SpeakButton word={item.word} iconType="volume-2" />
    </div>
    <p className="text-xs font-bold text-muted-foreground">
      {item.englishGloss || item.keyword}
    </p>
  </div>
);
