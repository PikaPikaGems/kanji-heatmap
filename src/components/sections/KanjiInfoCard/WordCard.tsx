import { Button } from "@/components/ui/button";

import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";
import { HiraganaWord } from "@/components/dependent/kana/HiraganaWord";

export const WordCard = ({
  word,
  spacedKana,
  highlightIndex,
  definition,
  wordKanjis,
}: {
  word: string;
  spacedKana: string;
  highlightIndex: number;
  definition: string;
  wordKanjis: { kanji: string; keyword: string }[];
}) => {
  return (
    <>
      <div className="flex justify-center -mb-2 text-center">
        <HiraganaWord rawKana={spacedKana} highlightIndex={highlightIndex} />
      </div>
      <GenericPopover
        trigger={
          <Button
            variant="ghost"
            className="items-end h-auto px-4 py-1 mt-1 text-4xl border-dashed rounded-2xl kanji-font hover:bg-foreground/5"
          >
            {word}
          </Button>
        }
        content={
          <VocabPopoverContent
            word={word}
            kana={spacedKana.split(" ").join("")}
            wordKanjis={wordKanjis}
            definition={definition}
          />
        }
      />
    </>
  );
};
