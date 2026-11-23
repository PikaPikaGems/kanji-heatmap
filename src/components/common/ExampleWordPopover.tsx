import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";
import {
  useVocabDetails,
  useWordKanjis,
} from "@/kanji-worker/kanji-worker-hooks";
import { cn } from "@/lib/utils";

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

  // Always a button showing the plain word. The popover opens with what is
  // already known (kanji links, actions, outside links); the reading and
  // meaning fill in when the word files answer, and stay out for a word
  // they don't have.
  const loading = status === "idle" || status === "loading";
  const reading = readingOverride ?? (vocabInfo?.reading || undefined);
  const definition =
    wordTranslationOverride ?? (vocabInfo?.meaning || undefined);

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
          {word}
        </Button>
      }
      content={
        <VocabPopoverContent
          word={word}
          kana={reading}
          wordKanjis={wordKanjis}
          definition={definition}
          optionalSection={optionalSection}
          definitionLoading={loading && wordTranslationOverride == null}
        />
      }
    />
  );
};
