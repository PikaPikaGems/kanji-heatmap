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

  // Always a button. Until the vocab data answers (or for a word it doesn't
  // have) the word shows without furigana, and the popover opens with what
  // is already known: kanji links, actions and outside links.
  const loading = status === "idle" || status === "loading";
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
            "h-auto items-end rounded-2xl px-4 py-3 kanji-font",
            "hover:bg-muted active:bg-muted border border-dashed",
            className
          )}
        >
          <span key={status} className="animate-fade-in-fast">
            {parts.map((part, i) => (
              <FuriganaPart key={`${i}-${part[0]}`} part={part} />
            ))}
          </span>
        </Button>
      }
      content={
        <VocabPopoverContent
          word={word}
          kana={readingOverride ?? (vocabInfo ? partsReading : undefined)}
          wordKanjis={wordKanjis}
          definition={wordTranslationOverride ?? vocabInfo?.meaning}
          optionalSection={optionalSection}
          definitionLoading={loading && wordTranslationOverride == null}
        />
      }
    />
  );
};
