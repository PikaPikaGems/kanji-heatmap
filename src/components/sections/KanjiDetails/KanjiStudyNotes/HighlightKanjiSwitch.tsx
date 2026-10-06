import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHighlightVocabKanji } from "@/hooks/use-highlight-vocab-kanji";

/** One shared preference: the same switch in study notes and the kanji essay. */
export const HighlightKanjiSwitch = ({ className }: { className?: string }) => {
  const id = useId();
  const [highlight, setHighlight] = useHighlightVocabKanji();

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Switch id={id} checked={highlight} onCheckedChange={setHighlight} />
      <Label htmlFor={id} className="text-xs font-bold cursor-pointer">
        Highlight Kanji
      </Label>
    </div>
  );
};
