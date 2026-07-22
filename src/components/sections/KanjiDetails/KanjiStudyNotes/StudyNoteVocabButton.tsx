import { GenericPopover } from "@/components/common/GenericPopover";
import { VocabPopoverContent } from "@/components/common/VocabPopoverContent";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { cn, isKanji } from "@/lib/utils";
import {
  useVocabDetails,
  useWordKanjis,
} from "@/kanji-worker/kanji-worker-hooks";
import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-hooks";
import { isJapanese } from "wanakana";

interface StudyNoteVocabButtonProps {
  word: string;
  kana?: string;
  definition?: string;
}

const wordHasKanji = (word: string) => [...word].some((char) => isKanji(char));

const isSingleKanji = (word: string) => [...word].length === 1 && isKanji(word);

export const StudyNoteVocabButton = ({
  word,
  kana: kanaOverride,
  definition: definitionOverride,
}: StudyNoteVocabButtonProps) => {
  const { status, vocabInfo } = useVocabDetails(word);
  const wordKanjis = useWordKanjis(word);
  const representativeWord = useKanjiRepresentativeWord(
    isSingleKanji(word) ? word : ""
  );

  if (!wordHasKanji(word)) {
    if (isJapanese(word)) {
      return <RomajiBadge kana={word} className={cn("text-lg px-2 py-0")} />;
    }

    return word;
  }

  if (status !== "success") {
    return (
      <span className="kanji-font" title="読み込み中 · Loading...">
        {word}
      </span>
    );
  }

  const kanaFromParts = (vocabInfo ?? { parts: [] }).parts
    .map((part) => part[1] || part[0])
    .join("");
  const kana =
    kanaOverride ||
    kanaFromParts ||
    (representativeWord?.word === word
      ? representativeWord.reading
      : undefined) ||
    undefined;
  const meaning =
    definitionOverride ||
    vocabInfo?.meaning ||
    representativeWord?.englishGloss ||
    undefined;

  return (
    <GenericPopover
      trigger={
        <button
          type="button"
          aria-label={word}
          className={cn(
            "kanji-font rounded-xl px-2 my-0.5",
            "border-theme-color-with-opacity-100 border background-theme-color-with-opacity-25",
            "hover:border-foreground",
            "hover-background-theme-color-with-opacity-100 hover:text-white",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          {word}
        </button>
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
