import { ReactNode } from "react";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";
  useWordKanjis,
} from "@/kanji-worker/kanji-worker-hooks";
const SmallFuriganaPart = ({
  part,
  className = "",
}: {
  part: WordPartDetail;
  className?: string;
}) => {
      <ruby className={className}>
        <rt />
      </ruby>
    );
    <ruby className={className}>
      <rt className="text-[0.5em]">{reading}</rt>
  wordTranslationOverride?: string;
  readingOverride?: string;
  className?: string;
  optionalSection?: ReactNode;
  /** Passed to the popover, e.g. a z-index to sit above a dialog. */
  contentClassName?: string;
export const ExampleWordPopover = ({
  word,
  wordTranslationOverride,
  readingOverride,
  className = "text-4xl",
  optionalSection,
  contentClassName,
}: ExampleWordPopoverProps) => {
  if (status !== "success") {
      <span
        className={`text-3xl cursor-default kanji-font ${className}`}
        title="読み込み中 · Loading..."
      >
  const kana =
    readingOverride ??
    (vocabInfo ?? { parts: [] }).parts
      .map((part) => part[1] || part[0])
      .join("");
  const meaning = wordTranslationOverride ?? vocabInfo?.meaning;

      contentClassName={contentClassName}
      trigger={
          variant="outline"
          className={`items-end h-auto px-4 py-3  border-dashed rounded-2xl kanji-font hover:bg-foreground/5 ${className}`}
          {vocabInfo?.parts == null ? (
            <span>{word}</span>
          ) : (
            vocabInfo.parts.map((part, index) => (
            ))
          )}
        </Button>
      }
        <VocabPopoverContent
          word={word}
          kana={kana}
          wordKanjis={wordKanjis}
          definition={meaning}
          optionalSection={optionalSection}
