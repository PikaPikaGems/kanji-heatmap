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
  blankClassName,
}: {
  word: string;
  kanji: string;
  revealed: boolean;
  /** Overrides on the blank's box, e.g. a thinner square one at small sizes. */
  blankClassName?: string;
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
          className={cn(BLANK_BOX_CN, blankCn.empty, blankClassName)}
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
          className="flex flex-col items-center justify-between min-w-0 gap-2 px-4 py-4 border border-dashed rounded-2xl border-foreground/15"
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

/** "1. to teach; to instruct 2. to tell" → ["to teach; to instruct", "to tell"]. */
const splitMeanings = (gloss: string) =>
  gloss
    .split(/\s*\d+\.\s+/)
    .map((meaning) => meaning.trim())
    .filter(Boolean);

/** One word's hint: its cloze and speak button, then its meanings. */
const WordHint = ({
  word,
  kanji,
  gloss,
}: {
  word: string;
  kanji: string;
  gloss: string;
}) => {
  const meanings = splitMeanings(gloss);
  return (
    <li className="flex flex-col gap-1.5 p-3 border border-dashed rounded-xl border-foreground/15">
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl kanji-font whitespace-nowrap" lang="ja">
          <Cloze
            word={word}
            kanji={kanji}
            revealed={false}
            blankClassName="rounded-md border-2"
          />
        </span>
        <SpeakButton word={word} iconType="volume-2" />
      </div>
      {meanings.length > 1 ? (
        <ol className="flex flex-col gap-0.5 pl-4 list-decimal marker:text-muted-foreground">
          {meanings.map((meaning) => (
            <li key={meaning} className="pl-0.5 text-pretty">
              {meaning}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-pretty">{meanings[0] ?? gloss}</p>
      )}
    </li>
  );
};

/**
 * "View hints": a card per word with its cloze, its speak button and its
 * English meanings, in a popover so the pad stays high.
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
    contentClassName="w-80 max-w-[calc(100vw-1.5rem)] p-3 text-sm text-left"
    content={
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Hints
        </p>
        {/* Each word as its cloze, never the whole word: that would give the
            answer away. */}
        <ul className="flex flex-col gap-2">
          {promptWords(item).map(({ word, englishGloss }) => (
            <WordHint
              key={word}
              word={word}
              kanji={item.kanji}
              gloss={englishGloss || item.keyword}
            />
          ))}
        </ul>
      </div>
    }
  />
);
