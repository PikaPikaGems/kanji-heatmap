import { Info } from "lucide-react";
import { SpeakButton } from "@/components/common/SpeakButton";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
import {
  BLANK_BOX_CN,
  blankCn,
} from "@/components/screens/FillTheKanjiScreen/blank-cn";
import type { PracticeWord } from "@/components/shared-practice";
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

/** "1. to teach; to instruct 2. to tell" → ["to teach; to instruct", "to tell"]. */
const splitMeanings = (gloss: string) =>
  gloss
    .split(/\s*\d+\.\s+/)
    .map((meaning) => meaning.trim())
    .filter(Boolean);

/**
 * The ⓘ in a word card's top-right corner: opens the word's speak button and
 * its English meanings (not the word, which the card already shows).
 */
const WordHintPopover = ({ word, gloss }: { word: string; gloss: string }) => {
  const meanings = splitMeanings(gloss);
  return (
    <GenericPopover
      trigger={
        <button
          type="button"
          aria-label="Show the meaning"
          className="absolute flex items-center justify-center transition-colors rounded-full top-1.5 right-1.5 size-6 text-muted-foreground hover:text-foreground hover:bg-foreground/10 data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground"
        >
          <Info aria-hidden className="size-3.5" />
        </button>
      }
      contentClassName="w-72 max-w-[calc(100vw-1.5rem)] p-3 text-sm text-left"
      content={
        <div className="flex items-start gap-3" lang="en">
          <SpeakButton word={word} iconType="volume-2" />
          {meanings.length > 1 ? (
            <ol className="flex flex-col gap-0.5 pt-1 pl-4 list-decimal marker:text-muted-foreground">
              {meanings.map((meaning) => (
                <li key={meaning} className="pl-0.5 text-pretty">
                  {meaning}
                </li>
              ))}
            </ol>
          ) : (
            <p className="pt-1.5 text-pretty">{meanings[0] ?? gloss}</p>
          )}
        </div>
      }
    />
  );
};

/**
 * The card's words with the target kanji blanked, each in its own dashed
 * card with its reading badges under it and an ⓘ in the corner that opens
 * its meaning and speak button. Kanji without a secondary word show the main word alone.
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
          className="relative flex flex-col items-center justify-between min-w-0 gap-2 px-4 pb-5 border border-dashed pt-7 rounded-2xl border-foreground/15"
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
          <WordHintPopover
            word={word.word}
            gloss={word.englishGloss || item.keyword}
          />
        </div>
      ))}
    </div>
  );
};
