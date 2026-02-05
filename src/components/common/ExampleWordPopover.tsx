import { Button } from "@/components/ui/button";
import { DottedSeparator } from "@/components/ui/dotted-separator";

import { GenericPopover } from "@/components/common/GenericPopover";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { SeeMore } from "@/components/common/SeeMore";
import { VocabActions } from "@/components/common/VocabActions";
import { GlobalKanjiLink } from "@/components/dependent/routing";

import { vocabExternalLinks } from "@/lib/external-links";
import {
  useGetKanjiInfoFn,
  useVocabDetails,
  WordPartDetail,
} from "@/kanji-worker/kanji-worker-hooks";

// Displays furigana above a word (small version for trigger)
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


// Helper to check if a character is a kanji
const isKanji = (char: string) => {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9faf) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) // CJK Unified Ideographs Extension A
  );
};

// Extract kanji characters from word with their keywords
const useWordKanjis = (word: string) => {
  const getKanjiInfo = useGetKanjiInfoFn();

  const kanjis = word.split("").filter(isKanji);
  const uniqueKanjis = [...new Set(kanjis)];

  if (!getKanjiInfo) {
    return [];
  }

  return uniqueKanjis
    .map((kanji) => {
      const info = getKanjiInfo(kanji);
      return {
        kanji,
        keyword: info?.keyword || "Unknown",
        isKanji: true,
      };
    })
    .filter((item) => item.keyword !== "Unknown" || item.isKanji);
};

interface ExampleWordPopoverProps {
  word: string;
}

export const ExampleWordPopover = ({ word }: ExampleWordPopoverProps) => {
  const { status, vocabInfo } = useVocabDetails(word);
  const wordKanjis = useWordKanjis(word);

  if (status !== "success" || !vocabInfo) {
    return (
      <span className="text-lg cursor-default kanji-font" title="Loading...">
        {word}
      </span>
    );
  }

  const kana = vocabInfo.parts.map((part) => part[1] || part[0]).join("");

  // Show furigana on the trigger button
  const TriggerWithFurigana = (
    <Button
      variant="ghost"
      className="items-end h-auto p-1 text-lg kanji-font hover:bg-gray-200 dark:hover:bg-gray-800"
    >
      {vocabInfo.parts.map((part, index) => (
        <SmallFuriganaPart key={`${part[0]}-${index}`} part={part} />
      ))}
    </Button>
  );

  return (
    <GenericPopover
      trigger={TriggerWithFurigana}
      content={
        <div className="w-64 p-2">
          {/* Kanji breakdown with keywords */}
          {wordKanjis.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center p-1">
                {wordKanjis.map((item, index) => (
                  <GlobalKanjiLink
                    key={`${item.kanji}-${index}`}
                    keyword={item.keyword}
                    kanji={item.kanji}
                  />
                ))}
              </div>
              <DottedSeparator />
            </>
          )}

          {/* Definition */}
          <DottedSeparator />
          <SeeMore
            definition={vocabInfo.meaning || "not provided"}
            maxLen={150}
          />

          {/* External links */}
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
