import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";

import {
  useVocabDetails,
  useWordKanjis,
  WordPartDetail,
} from "@/kanji-worker/kanji-worker-hooks";

const SmallFuriganaPart = ({
  part,
  className = "",
}: {
  part: WordPartDetail;
  className?: string;
}) => {
  const [text, reading] = part;

  if (!reading) {
    return (
      <ruby className={className}>
        {text}
        <rt />
      </ruby>
    );
  }

  return (
    <ruby className={className}>
      {text}
      <rp>(</rp>
      <rt className="text-[0.5em]">{reading}</rt>
      <rp>)</rp>
    </ruby>
  );
};

interface ExampleWordPopoverProps {
  word: string;
  wordTranslationOverride?: string;
  readingOverride?: string;
  className?: string;
  optionalSection?: ReactNode;
}

export const ExampleWordPopover = ({
  word,
  wordTranslationOverride,
  readingOverride,
  className = "text-4xl",
  optionalSection,
}: ExampleWordPopoverProps) => {
  const { status, vocabInfo } = useVocabDetails(word);
  const wordKanjis = useWordKanjis(word);

  if (status !== "success") {
    return (
      <span
        className={`text-3xl cursor-default kanji-font ${className}`}
        title="読み込み中 · Loading..."
      >
        {word}
      </span>
    );
  }

  const kana =
    readingOverride ??
    (vocabInfo ?? { parts: [] }).parts
      .map((part) => part[1] || part[0])
      .join("");
  const meaning = wordTranslationOverride ?? vocabInfo?.meaning;

  return (
    <GenericPopover
      trigger={
        <Button
          variant="outline"
          className={`items-end h-auto px-4 py-3  border-dashed rounded-2xl kanji-font hover:bg-foreground/5 ${className}`}
        >
          {vocabInfo?.parts == null ? (
            <span>{word}</span>
          ) : (
            vocabInfo.parts.map((part, index) => (
              <SmallFuriganaPart key={`${part[0]}-${index}`} part={part} />
            ))
          )}
        </Button>
      }
      content={
        <VocabPopoverContent
          word={word}
          kana={kana}
          wordKanjis={wordKanjis}
          definition={meaning}
          optionalSection={optionalSection}
        />
      }
    />
  );
};
