import { DottedSeparator } from "@/components/ui/dotted-separator";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { SeeMore } from "@/components/common/SeeMore";
import { VocabActions } from "@/components/common/VocabActions";
import { GlobalKanjiLink } from "@/components/dependent/routing";
import { vocabExternalLinks } from "@/lib/external-links";

interface VocabPopoverContentProps {
  word: string;
  kana: string;
  wordKanjis: { kanji: string; keyword: string }[];
  definition?: string;
}

export const VocabPopoverContent = ({ word, kana, wordKanjis, definition }: VocabPopoverContentProps) => {
  return (
    <div className="p-2 w-72">
      {wordKanjis.length > 0 && (
        <div className="flex flex-wrap justify-center p-1">
          {wordKanjis.map((item, index) => (
            <GlobalKanjiLink
              key={`${item.kanji}-${index}`}
              keyword={item.keyword}
              kanji={item.kanji}
            />
          ))}
        </div>
      )}
      {definition && (
        <>
          <DottedSeparator />
          <SeeMore definition={definition} maxLen={150} />
        </>
      )}
      <DottedSeparator />
      <VocabActions kana={kana} word={word} />
      <DottedSeparator />
      <div className="flex flex-wrap justify-center pt-2 text-xs font-bold">
        Explore this word further
      </div>
      <div className="flex flex-wrap justify-center px-2 pb-2 text-xs">
        {vocabExternalLinks.map((item) => (
          <ExternalTextLink key={item.name} href={item.url(word)} text={item.name} />
        ))}
      </div>
    </div>
  );
};
