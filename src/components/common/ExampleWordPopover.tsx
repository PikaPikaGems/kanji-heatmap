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
  const { status, vocabInfo } = useVocabDetails(word);
  const wordKanjis = useWordKanjis(word);

  // Plain text only while loading; a word missing from the vocab data (or a
  // failed lookup) is still a button, shown without furigana.
  if (status === "idle" || status === "loading") {
    return (
      <span
        className={cn("cursor-default kanji-font", className)}
        title="読み込み中 · Loading..."
      >
        {word}
      </span>
    );
  }

  const parts: WordPartDetail[] = vocabInfo?.parts ?? [[word]];
  const partsReading = parts
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
          {parts.map((part, i) => (
            <FuriganaPart key={`${i}-${part[0]}`} part={part} />
          ))}
        </Button>
      }
      content={
        <VocabPopoverContent
          word={word}
          kana={readingOverride ?? (vocabInfo ? partsReading : undefined)}
          wordKanjis={wordKanjis}
          definition={wordTranslationOverride ?? vocabInfo?.meaning}
          optionalSection={optionalSection}
        />
      }
    />
  );
};
