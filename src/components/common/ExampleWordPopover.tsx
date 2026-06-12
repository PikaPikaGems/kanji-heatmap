import { Button } from "@/components/ui/button";

import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";

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
  wordTranslationOverride?: string;
}

export const ExampleWordPopover = ({ word, wordTranslationOverride }: ExampleWordPopoverProps) => {
  const { status, vocabInfo } = useVocabDetails(word);
  const wordKanjis = useWordKanjis(word);

  if (status !== "success") {
    return (
      <span className="text-3xl cursor-default kanji-font" title="Loading...">
        {word}
      </span>
    );
  }

  const kana = (vocabInfo ?? { parts: [] }).parts.map((part) => part[1] || part[0]).join("");
  const meaning = wordTranslationOverride ?? vocabInfo?.meaning;

  return (
    <GenericPopover
      trigger={
        <Button
          variant="outline"
          className="items-end h-auto px-4 py-2 text-3xl border-dashed rounded-2xl kanji-font hover:bg-foreground/5"
        >
          {vocabInfo?.parts == null
            ? word
            : vocabInfo.parts.map((part, index) => (
                <SmallFuriganaPart key={`${part[0]}-${index}`} part={part} />
              ))}
        </Button>
      }
      content={
        <VocabPopoverContent
          word={word}
          kana={kana}
          wordKanjis={wordKanjis}
          definition={meaning}
        />
      }
    />
  );
};
