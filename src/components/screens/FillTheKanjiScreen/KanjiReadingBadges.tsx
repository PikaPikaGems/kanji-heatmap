import { useState } from "react";
import { badgeVariants } from "@/components/ui/badge-utils";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { useKanjiInfo } from "@/kanji-worker/kanji-worker-hooks";
import type {
  GeneralKanjiItem,
  HoverItemReturnData,
} from "@/lib/kanji/kanji-info-types";
import { translateValue } from "@/lib/wanakana-adapter";
import { cn } from "@/lib/utils";

const MAX_READINGS = 4;

/**
 * シャ for ジャ, ひ for -び: the reading without (han)dakuten or the
 * okurigana and affix marks.
 */
const unvoiced = (reading: string) =>
  reading
    .replace(/[-.。]/g, "")
    .normalize("NFD")
    .replace(/[\u3099\u309A]/g, "")
    .normalize("NFC");

/** Drops rendaku forms (ジャ after シャ, -び after ひ) that repeat an earlier reading. */
const withoutRendaku = (readings: string[]) =>
  readings.filter(
    (r, i) => readings.findIndex((o) => unvoiced(o) === unvoiced(r)) === i
  );

/**
 * Up to four readings: onyomi first, then kunyomi to fill the rest, without
 * rendaku repeats; a "· · ·" badge shows the rest. An onyomi that the phonetic component
 * gives (間 → カン from 門) gets a solid lime border, the lime of the sound
 * hint in the kanji drawer.
 */
export const KanjiReadingBadges = ({ kanji }: { kanji: string }) => {
  const general = useKanjiInfo(kanji, "general")
    .data as GeneralKanjiItem | null;
  const hover = useKanjiInfo(kanji, "hover-card")
    .data as HoverItemReturnData | null;

  const [showAll, setShowAll] = useState(false);

  if (general == null) return null;

  const allOnyomi = withoutRendaku(general.allOn);
  const allKunyomi = withoutRendaku(general.allKun);
  const hasMore = allOnyomi.length + allKunyomi.length > MAX_READINGS;
  const onyomi = showAll ? allOnyomi : allOnyomi.slice(0, MAX_READINGS);
  const kunyomi = showAll
    ? allKunyomi
    : allKunyomi.slice(0, MAX_READINGS - onyomi.length);
  const phoneticSounds = hover?.phonetic?.sound ?? [];
  const isPhonetic = (on: string) =>
    phoneticSounds.includes(translateValue(on, "hiragana"));

  if (onyomi.length === 0 && kunyomi.length === 0) return null;

  return (
    // Keyed so the full list fades in when "· · ·" opens it.
    <div
      key={String(showAll)}
      className={cn(
        "flex flex-wrap justify-center",
        showAll && "animate-fade-in-fast"
      )}
    >
      {onyomi.map((on) => (
        <RomajiBadge
          key={on}
          kana={on}
          className={cn(
            "m-0.5 px-2 py-0.5 sm:py-0.5 text-base sm:text-base",
            isPhonetic(on) && "border-2 border-lime-500 dark:border-lime-400"
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
      {hasMore && !showAll && (
        <button
          type="button"
          className={cn(
            badgeVariants({ variant: "outline" }),
            "m-0.5 px-2 py-0.5 text-base cursor-pointer whitespace-nowrap hover:bg-neon-accent hover:text-black"
          )}
          aria-label="Show all readings"
          onClick={() => setShowAll(true)}
        >
          · · ·
        </button>
      )}
    </div>
  );
};
