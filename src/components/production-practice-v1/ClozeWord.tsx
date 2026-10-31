import { Fragment } from "react";
import { SpeakButton } from "@/components/common/SpeakButton";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
import {
  BLANK_BOX_CN,
  blankCn,
} from "@/components/screens/FillTheKanjiScreen/blank-cn";
import type { PracticeWord } from "@/components/shared-practice";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import type { PracticeItem } from "./types";

/** One word with the target kanji as Fill in the Kanji's "?" blank, or shown once revealed. */
const Cloze = ({
  word,
  kanji,
  revealed,
}: {
  word: string;
  kanji: string;
  revealed: boolean;
}) => {
  const idx = word.indexOf(kanji);
  const before = idx === -1 ? "" : word.slice(0, idx);
  const after = idx === -1 ? word : word.slice(idx + kanji.length);

  return (
    <span className="inline-flex items-center justify-center whitespace-nowrap">
      {before}
      {revealed ? (
        <span className="mx-[0.2em]">{kanji}</span>
      ) : (
        <span
          className={cn(BLANK_BOX_CN, blankCn.empty)}
          aria-label="missing kanji"
        >
          <span className="text-[0.55em] font-extrabold">?</span>
        </span>
      )}
      {after}
    </span>
  );
};

/** The word's reading badges (tap for romaji), a size smaller than elsewhere. */
const ReadingBadges = ({ word }: { word: PracticeWord }) => (
  <span className="flex flex-wrap items-center justify-center">
    {word.reading.split("・").map((reading) => (
      <RomajiBadge
        key={reading}
        kana={reading}
        className="m-0.5 px-2.5 py-0.5 sm:py-1 text-base sm:text-lg"
      />
    ))}
  </span>
);

/** Fill in the Kanji's prompt size, a step smaller for long word pairs. */
const sizeCn = (length: number) =>
  length > 6 ? "text-2xl sm:text-4xl" : "text-3xl sm:text-5xl";

/** The card's words: the main one, then the secondary one when it has one. */
const promptWords = (item: PracticeItem): PracticeWord[] =>
  item.secondary ? [item, item.secondary] : [item];

/**
 * The card's words with the target kanji blanked, each in its own dashed
 * card with its reading badges under it. Kanji without a secondary word
 * show the main word alone. The speak buttons are in "View hints".
 */
export const ClozeWords = ({
  item,
  revealed = false,
}: {
  item: PracticeItem;
  /** When true, show the real kanji instead of the "?" blanks. */
  revealed?: boolean;
}) => {
  const words = promptWords(item);
  const length = words.reduce((sum, { word }) => sum + word.length, 0);
  const fontStyle =
    item.fontIndex === null
      ? undefined
      : {
          fontFamily: `var(--jap-font-${item.fontIndex}), "Noto Sans JP", system-ui`,
        };

  return (
    <div
      lang="ja"
      className="flex flex-wrap items-stretch justify-center max-w-full gap-3"
    >
      {words.map((word) => (
        <div
          key={word.word}
          className="flex flex-col items-center justify-between min-w-0 gap-1 px-3 pt-2 pb-1 border border-dashed rounded-2xl border-foreground/30"
        >
          <p
            className={cn(
              "leading-tight",
              sizeCn(length),
              item.fontIndex === null && "kanji-font"
            )}
            style={fontStyle}
          >
            <Cloze word={word.word} kanji={item.kanji} revealed={revealed} />
          </p>
          <ReadingBadges word={word} />
        </div>
      ))}
    </div>
  );
};

/**
 * "View hints": each word's cloze, its speak button and its English
 * meaning, in a popover so the pad stays high.
 */
export const HintsPopover = ({ item }: { item: PracticeItem }) => (
  <GenericPopover
    trigger={
      <button
        type="button"
        className={cn(cnDottedUnderlineTrigger, "text-xs font-bold")}
      >
        View hints
      </button>
    }
    contentClassName="w-80 max-w-[calc(100vw-1.5rem)] p-3 text-xs text-left"
    content={
      // Each word as its cloze, never the whole word: that would give the
      // answer away.
      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-2">
        {promptWords(item).map(({ word, englishGloss }) => (
          <Fragment key={word}>
            <span className="text-lg kanji-font whitespace-nowrap" lang="ja">
              <Cloze word={word} kanji={item.kanji} revealed={false} />
            </span>
            <SpeakButton word={word} iconType="volume-2" />
            <p className="text-pretty">{englishGloss || item.keyword}</p>
          </Fragment>
        ))}
      </div>
    }
  />
);
