import { GenericPopover } from "@/components/common/GenericPopover";
import { SpeakButton } from "@/components/common/SpeakButton";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { KanjiKeywordCard } from "@/components/dependent/routing/global-links";
import { DottedSeparator } from "@/components/ui/dotted-separator";
import type { PracticeWord } from "@/components/shared-practice";
import { KanjiPopover } from "@/components/shared-practice/KanjiPopover";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import type { PracticeItem } from "../types";

/** Each kanji of the word as the vocab popover's kanji cards, not clickable. */
const WordKanjiCards = ({ word }: { word: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  const cards = [...new Set(word)].flatMap((char) => {
    const keyword = getKanjiInfo?.(char)?.keyword;
    return keyword ? [{ char, keyword }] : [];
  });
  if (cards.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center p-1">
      {cards.map(({ char, keyword }) => (
        <KanjiKeywordCard key={char} kanji={char} keyword={keyword} />
      ))}
    </div>
  );
};

/**
 * One answer word, in a dashed pill.
 * Tapping it opens the word: its readings and speak button, its gloss then
 * the word itself, and each of its kanji with the kanji's keyword.
 */
const AnswerWordPopover = ({
  word,
  fallbackGloss,
}: {
  word: PracticeWord;
  fallbackGloss: string;
}) => (
  <GenericPopover
    // Inside a drawer: modal, or the popover can't be clicked.
    modal
    focusOnOpen={false}
    trigger={
      <button
        type="button"
        lang="ja"
        className="px-2 py-2 transition-colors border border-dashed rounded-2xl cursor-pointer kanji-font border-foreground/30 hover:bg-foreground/10 hover:border-foreground/60 active:bg-foreground/20"
      >
        {word.word}
      </button>
    }
    contentClassName="w-72 max-w-[calc(100vw-1.5rem)] p-0"
    content={
      <div className="flex flex-col items-center p-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1 py-1">
          {word.reading.split("・").map((reading) => (
            <RomajiBadge key={reading} kana={reading} />
          ))}
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <SpeakButton word={word.word} iconType="volume-2" />
        </div>
        <p className="px-2 pb-2 text-xs font-bold text-muted-foreground text-pretty">
          {word.englishGloss || fallbackGloss}
          <span aria-hidden> · </span>
          <span lang="ja" className="kanji-font whitespace-nowrap">
            {word.word}
          </span>
        </p>
        <DottedSeparator />
        <WordKanjiCards word={word.word} />
      </div>
    }
  />
);

/** The answer kanji, a size up from the words; opens the kanji popover. */
const AnswerKanji = ({ kanji }: { kanji: string }) => {
  const info = useGetKanjiInfoFn()?.(kanji);
  if (!info) {
    return (
      <span lang="ja" className="px-3 py-1 text-3xl kanji-font">
        {kanji}
      </span>
    );
  }
  return (
    <KanjiPopover
      kanji={kanji}
      info={info}
      className="px-3 py-1 text-3xl border border-dashed rounded-2xl kanji-font border-foreground/30 hover:border-foreground/60"
    />
  );
};

/**
 * The answer: the kanji, "·", then the card's words, "高 · 高い 最高" (or
 * the main word alone). The kanji opens the kanji popover, each word its
 * own popover. Shared across feedback drawers.
 */
export const ItemReveal = ({ item }: { item: PracticeItem }) => {
  const words = item.secondary ? [item, item.secondary] : [item];
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-xl text-foreground">
      <AnswerKanji kanji={item.kanji} />
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      {words.map((word) => (
        <AnswerWordPopover
          key={word.word}
          word={word}
          fallbackGloss={item.keyword}
        />
      ))}
    </div>
  );
};
