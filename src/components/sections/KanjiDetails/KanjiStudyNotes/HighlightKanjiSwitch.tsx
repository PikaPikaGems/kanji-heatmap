import { FlagSwitch } from "@/components/common/FlagSwitch";
import { useHighlightVocabKanji } from "@/hooks/use-highlight-vocab-kanji";

/** One shared preference: the same switch in study notes and the kanji essay. */
export const HighlightKanjiSwitch = ({ className }: { className?: string }) => {
  const [highlight, setHighlight] = useHighlightVocabKanji();

  return (
    <FlagSwitch
      label="Highlight Kanji"
      checked={highlight}
      onCheckedChange={setHighlight}
      className={className}
    />
  );
};
