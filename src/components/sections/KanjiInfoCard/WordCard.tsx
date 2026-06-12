import { Button } from "@/components/ui/button";
import { DottedSeparator } from "@/components/ui/dotted-separator";

import { GenericPopover } from "@/components/common/GenericPopover";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";

import { GlobalKanjiLink } from "@/components/dependent/routing";
import { HiraganaWord } from "@/components/dependent/kana/HiraganaWord";
import { vocabExternalLinks } from "@/lib/external-links";
import { SeeMore } from "@/components/common/SeeMore";
import { VocabActions } from "@/components/common/VocabActions";

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
            className="items-end h-auto px-4 py-1 mt-1 text-3xl border-dashed rounded-2xl kanji-font hover:bg-foreground/5"
          >
            {word}
          </Button>
        }
        content={
          <div className="w-64">
            <div className="flex flex-wrap justify-center p-1">
              {wordKanjis.map((item, index) => {
                return (
                  <GlobalKanjiLink
                    key={`${item.kanji}-${index}`}
                    keyword={item.keyword}
                    kanji={item.kanji}
                  />
                );
              })}
            </div>

            <DottedSeparator />
            <SeeMore definition={definition} />
            <DottedSeparator />
            <VocabActions kana={spacedKana.split(" ").join("")} word={word} />
            <DottedSeparator />
            <div className="flex flex-wrap justify-center pt-2 text-xs font-bold">
              Learn more from:
            </div>
            <div className="flex flex-wrap justify-center px-2 pb-2 text-xs">
              {vocabExternalLinks.map((item) => {
                return (
                  <ExternalTextLink
                    key={item.name}
                    href={item.url(word)}
                    text={item.name}
                  />
                );
              })}
            </div>
          </div>
        }
      />
    </>
  );
};
