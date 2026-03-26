import { Button } from "@/components/ui/button";
import { DottedSeparator } from "@/components/ui/dotted-separator";

import { GenericPopover } from "@/components/common/GenericPopover";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { SeeMore } from "@/components/common/SeeMore";
import { VocabActions } from "@/components/common/VocabActions";
import { GlobalKanjiLink } from "@/components/dependent/routing";

import { vocabExternalLinks } from "@/lib/external-links";
import {
  useVocabDetails,
  useWordKanjis,
  WordPartDetail,
} from "@/kanji-worker/kanji-worker-hooks";

const SmallFuriganaPart = ({ part }: { part: WordPartDetail }) => {
  const [text, reading] = part;

  if (!reading) {
    return <span>{text}</span>;
  }

  return (
    <ruby>
      {text}
      <rp>(</rp>
      <rt className="text-[0.6em]">{reading}</rt>
      <rp>)</rp>
    </ruby>
  );
};

interface ExampleWordPopoverProps {
  word: string;
  wordTranslationOverride?: string
}

export const ExampleWordPopover = ({ word, wordTranslationOverride }: ExampleWordPopoverProps) => {
  const { status, vocabInfo } = useVocabDetails(word);
  const wordKanjis = useWordKanjis(word);

  if (status !== "success") {
    return (
      <span className="text-lg cursor-default kanji-font" title="Loading...">
        {word}
      </span>
    );
  }

  const kana = (vocabInfo ?? { parts: [] }).parts.map((part) => part[1] || part[0]).join("");

  const meaning = wordTranslationOverride ?? vocabInfo?.meaning
  return (
    <GenericPopover
      trigger={
        <Button
          variant="outline"
          className="items-end h-auto px-4 py-2 text-3xl border-dashed rounded-2xl kanji-font hover:bg-foreground/5"
        >
          {vocabInfo?.parts == null ? word :
            vocabInfo.parts.map((part, index) => (
              <SmallFuriganaPart key={`${part[0]}-${index}`} part={part} />
            ))}

        </Button>}
      content={
        <div className="w-64 p-2">
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
          {meaning && <>
            <DottedSeparator />
            <SeeMore
              definition={meaning}
              maxLen={150}
            />
          </>
          }
          <DottedSeparator />
          <div className="flex flex-wrap justify-center pt-2 text-xs font-bold">
            Learn more from:
          </div>
          <div className="flex flex-wrap justify-center pb-2 text-xs">
            {vocabExternalLinks.map((item) => (
              <ExternalTextLink
                key={item.name}
                href={item.url(word)}
                text={item.name}
              />
            ))}
          </div>
          <DottedSeparator />
          <VocabActions kana={kana} word={word} />
        </div>
      }
    />
  );
};
