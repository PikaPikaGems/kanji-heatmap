import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { HiraganaWord } from "@/components/dependent/kana/HiraganaWord";
import { WordFrequencyTags } from "@/components/sections/KanjiDetails/WordFrequencyTags";

/**
 * A reference card sample word: its kana, with this kanji's part highlighted,
 * above the shared word popover.
 */
export const WordCard = ({
  word,
  spacedKana,
  highlightIndex,
  definition,
}: {
  word: string;
  spacedKana: string;
  highlightIndex: number;
  definition: string;
}) => {
  return (
    <>
      <div className="flex justify-center -mb-2 text-center">
        <HiraganaWord rawKana={spacedKana} highlightIndex={highlightIndex} />
      </div>
      <ExampleWordPopover
        word={word}
        readingOverride={spacedKana.split(" ").join("")}
        wordTranslationOverride={definition || undefined}
        className="px-4 py-2 m-2 text-4xl border-dotted border-foreground/50"
        optionalSection={<WordFrequencyTags word={word} />}
      />
    </>
  );
};
