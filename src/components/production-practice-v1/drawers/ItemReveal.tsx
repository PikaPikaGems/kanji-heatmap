import { Fragment } from "react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { SpeakButton } from "@/components/common/SpeakButton";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import type { PracticeWord } from "@/components/shared-practice";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import type { PracticeItem } from "../types";

/** Each kanji of the word with its keyword: "高 · HIGH". */
const WordKanjiList = ({ word }: { word: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  const kanjiRows = [...new Set(word)].flatMap((char) => {
    const keyword = getKanjiInfo?.(char)?.keyword;
    return keyword ? [{ char, keyword }] : [];
  });
  if (kanjiRows.length === 0) return null;

  return (
    <div className="w-full pt-3 border-t border-dotted">
      <ul className="grid grid-cols-[auto_auto_auto] items-center mx-auto gap-x-2 gap-y-1 w-fit">
        {kanjiRows.map(({ char, keyword }) => (
          <li key={char} className="contents">
            <span className="text-2xl leading-none kanji-font" lang="ja">
              {char}
            </span>
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <span className="text-xs font-bold text-left uppercase">
              {keyword}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * One answer word, dashed-underlined like Fill in the Kanji's answer kanji.
 * Tapping it opens the word: its readings and speak button, its gloss, and
 * each of its kanji with the kanji's keyword.
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
        className="px-1 rounded-lg cursor-pointer kanji-font underline underline-offset-8 decoration-dashed decoration-foreground/10 transition-colors hover:decoration-foreground hover:decoration-solid hover:bg-foreground/10 active:bg-foreground/20"
      >
        {word.word}
      </button>
    }
    contentClassName="w-64 max-w-[calc(100vw-1.5rem)] p-0"
    content={
      <div className="flex flex-col items-center gap-2 px-4 py-3 text-center">
        <span className="text-lg font-bold kanji-font" lang="ja">
          {word.word}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {word.reading.split("・").map((reading) => (
            <RomajiBadge key={reading} kana={reading} />
          ))}
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <SpeakButton word={word.word} iconType="volume-2" />
        </div>
        <p className="text-xs font-bold text-muted-foreground text-pretty">
          {word.englishGloss || fallbackGloss}
        </p>
        <WordKanjiList word={word.word} />
      </div>
    }
  />
);

/**
 * The card's words, "高い · 最高" (or the main word alone); each opens its
 * own popover. Shared across feedback drawers.
 */
export const ItemReveal = ({ item }: { item: PracticeItem }) => {
  const words = item.secondary ? [item, item.secondary] : [item];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 text-4xl text-foreground">
      {words.map((word, i) => (
        <Fragment key={word.word}>
          {i > 0 && (
            <span aria-hidden className="text-2xl text-muted-foreground">
              ·
            </span>
          )}
          <AnswerWordPopover word={word} fallbackGloss={item.keyword} />
        </Fragment>
      ))}
    </div>
  );
};
