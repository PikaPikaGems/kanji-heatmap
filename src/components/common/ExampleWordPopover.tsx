import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";
import {
  useVocabDetails,
  useWordKanjis,
  WordPartDetail,
} from "@/kanji-worker/kanji-worker-hooks";
import { cn } from "@/lib/utils";

/** One piece of the word; kanji pieces carry their reading as furigana. */
const FuriganaPart = ({ part }: { part: WordPartDetail }) => {
  const [text, furigana] = part;
  if (!furigana) return <span>{text}</span>;

  return (
    <ruby>
      {text}
      <rt className="text-[0.5em]">{furigana}</rt>
    </ruby>
  );
};

interface ExampleWordPopoverProps {
  word: string;
  wordTranslationOverride?: string;
  readingOverride?: string;
  className?: string;
  optionalSection?: ReactNode;
  /** Passed to the popover, e.g. a z-index to sit above a dialog. */
  contentClassName?: string;
}

export const ExampleWordPopover = ({
  word,
  wordTranslationOverride,
  readingOverride,
  className = "text-4xl",
  optionalSection,
  contentClassName,
}: ExampleWordPopoverProps) => {
  const { vocabInfo } = useVocabDetails(word);
  const wordKanjis = useWordKanjis(word);

  if (vocabInfo == null) {
    return (
      <span className={cn("cursor-default kanji-font", className)}>{word}</span>
    );
  }

  const partsReading = vocabInfo.parts
    .map(([text, furigana]) => furigana || text)
    .join("");

  return (
    <GenericPopover
      contentClassName={contentClassName}
      trigger={
        <Button
          variant="outline"
          className={cn(
            "h-auto items-end rounded-2xl border-dotted px-4 py-3 kanji-font",
            "hover:bg-muted active:bg-muted",
            className
          )}
        >
          {vocabInfo.parts.map((part, i) => (
            <FuriganaPart key={`${i}-${part[0]}`} part={part} />
          ))}
        </Button>
      }
      content={
        <VocabPopoverContent
          word={word}
          kana={readingOverride ?? partsReading}
          wordKanjis={wordKanjis}
          definition={wordTranslationOverride ?? vocabInfo.meaning}
          optionalSection={optionalSection}
        />
      }
    />
  );
};
