import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { useKanjiInfo } from "@/kanji-worker/kanji-worker-hooks";
import type {
  GeneralKanjiItem,
  HoverItemReturnData,
} from "@/lib/kanji/kanji-info-types";
import { translateValue } from "@/lib/wanakana-adapter";
import { cn } from "@/lib/utils";

const MAX_ONYOMI = 4;

/**
 * Up to four onyomi, plus the first kunyomi when there is only one onyomi,
 * so there are usually at least two. An onyomi that the phonetic component
 * gives (間 → カン from 門) gets the same lime tint as the sound hint in the
 * kanji drawer.
 */
export const KanjiReadingBadges = ({ kanji }: { kanji: string }) => {
  const general = useKanjiInfo(kanji, "general")
    .data as GeneralKanjiItem | null;
  const hover = useKanjiInfo(kanji, "hover-card")
    .data as HoverItemReturnData | null;

  if (general == null) return null;

  const onyomi = general.allOn.slice(0, MAX_ONYOMI);
  const kunyomi = onyomi.length <= 1 ? general.allKun.slice(0, 1) : [];
  const phoneticSounds = hover?.phonetic?.sound ?? [];
  const isPhonetic = (on: string) =>
    phoneticSounds.includes(translateValue(on, "hiragana"));

  if (onyomi.length === 0 && kunyomi.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center">
      {onyomi.map((on) => (
        <RomajiBadge
          key={on}
          kana={on}
          className={cn(
            "m-0.5 px-2 py-0.5 sm:py-0.5 text-base sm:text-base",
            isPhonetic(on) && "bg-lime-100 dark:bg-lime-400/15"
          )}
        />
      ))}
      {kunyomi.map((kun) => (
        <RomajiBadge
          key={kun}
          kana={kun}
          className="m-0.5 px-2 py-0.5 sm:py-0.5 text-base sm:text-base"
        />
      ))}
    </div>
  );
};
