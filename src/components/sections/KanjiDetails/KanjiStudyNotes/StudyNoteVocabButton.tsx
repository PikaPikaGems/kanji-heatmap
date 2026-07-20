import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";
import { Button } from "@/components/ui/button";
import { useWordKanjis } from "@/kanji-worker/kanji-worker-hooks";

interface StudyNoteVocabButtonProps {
  word: string;
  kana?: string;
  definition?: string;
}

export const StudyNoteVocabButton = ({
  word,
  kana,
  definition,
}: StudyNoteVocabButtonProps) => {
  const wordKanjis = useWordKanjis(word);

  return (
    <GenericPopover
      trigger={
        <Button
          type="button"
          variant="outline"
          className="inline-flex h-auto px-1 py-0 mx-0.5 align-baseline border-dashed rounded-sm font-normal kanji-font"
        >
          {word}
        </Button>
      }
      content={
        <VocabPopoverContent
          word={word}
          kana={kana}
          wordKanjis={wordKanjis}
          definition={definition}
        />
      }
    />
  );
};
