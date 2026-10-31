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

/** The word's reading badges (tap for romaji) and its speak button, under the word. */
const ReadingLine = ({ word }: { word: PracticeWord }) => (
  <span className="flex flex-wrap items-center justify-center gap-1">
    {word.reading.split("・").map((reading) => (
      <RomajiBadge key={reading} kana={reading} />
    ))}
    <SpeakButton word={word.word} iconType="volume-2" />
  </span>
);

/** Fill in the Kanji's prompt size, a step smaller for long word pairs. */
const sizeCn = (length: number) =>
  length > 6 ? "text-2xl sm:text-4xl" : "text-3xl sm:text-5xl";

/**
 * The card's words with the target kanji blanked, "[?]い · 最[?]", each with
 * its reading badges and a speak button under it. Kanji without a secondary word
 * show the main word alone.
 */
export const ClozeWords = ({
  item,
  revealed = false,
}: {
  item: PracticeItem;
  /** When true, show the real kanji instead of the "?" blanks. */
  revealed?: boolean;
}) => {
  const { secondary } = item;
  const length = item.word.length + (secondary?.word.length ?? 0);
  const fontStyle =
    item.fontIndex === null
      ? undefined
      : {
          fontFamily: `var(--jap-font-${item.fontIndex}), "Noto Sans JP", system-ui`,
        };

  return (
    <div
      lang="ja"
      className={cn(
        "grid items-center max-w-full gap-y-1 justify-items-center",
        secondary ? "grid-cols-[auto_auto_auto] gap-x-2" : "grid-cols-1"
      )}
    >
      <p
        className={cn(
          "leading-tight",
          sizeCn(length),
          item.fontIndex === null && "kanji-font"
        )}
        style={fontStyle}
      >
        <Cloze word={item.word} kanji={item.kanji} revealed={revealed} />
      </p>
      {secondary && (
        <>
          <span
            aria-hidden
            className={cn("text-muted-foreground", sizeCn(length))}
          >
            ·
          </span>
          <p
            className={cn(
              "leading-tight",
              sizeCn(length),
              item.fontIndex === null && "kanji-font"
            )}
            style={fontStyle}
          >
            <Cloze
              word={secondary.word}
              kanji={item.kanji}
              revealed={revealed}
            />
          </p>
        </>
      )}
      <ReadingLine word={item} />
      {secondary && (
        <>
          <span aria-hidden />
          <ReadingLine word={secondary} />
        </>
      )}
    </div>
  );
};

/**
 * "View English glosses": each word's meaning next to its cloze, in a popover
 * so the pad stays high.
 */
export const GlossesPopover = ({ item }: { item: PracticeItem }) => {
  const words = item.secondary ? [item, item.secondary] : [item];
  return (
    <GenericPopover
      trigger={
        <button
          type="button"
          className={cn(cnDottedUnderlineTrigger, "text-xs font-bold")}
        >
          View English {words.length > 1 ? "glosses" : "gloss"}
        </button>
      }
      contentClassName="w-72 p-3 text-xs text-left"
      content={
        // Each word as its cloze, never the whole word: that would give the
        // answer away.
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
          {words.map(({ word, englishGloss }) => (
            <Fragment key={word}>
              <span className="text-lg kanji-font" lang="ja">
                <Cloze word={word} kanji={item.kanji} revealed={false} />
              </span>
              <p>{englishGloss || item.keyword}</p>
            </Fragment>
          ))}
        </div>
      }
    />
  );
};
