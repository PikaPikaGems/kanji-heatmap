import { Button } from "@/components/ui/button";

import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";
import { HiraganaWord } from "@/components/dependent/kana/HiraganaWord";
import { WordTagBadges } from "@/components/sections/KanjiDetails/WordTagBadges";
import { toTagsWordEntry } from "@/lib/kanji/anchor-words";
import { useWordTags } from "@/providers/kanji-representative-word-hooks";

/** The word's tags and tier, when it has any. Asked for when the popover opens. */
const WordCardTags = ({ word }: { word: string }) => {
  const found = useWordTags(word);
  if (found == null) return null;
  return (
    <div className="pb-2 animate-fade-in-fast">
      <WordTagBadges
        entry={toTagsWordEntry(word, found.tags, found.tier)}
        isName={found.tags.includes("name")}
        maxVisible={3}
        className="justify-center"
      />
    </div>
  );
};

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
            className="items-end h-auto px-4 py-2 mt-1 text-4xl border-dashed rounded-2xl kanji-font hover:bg-foreground/5"
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
            optionalSection={<WordCardTags word={word} />}
          />
        }
      />
    </>
  );
};
