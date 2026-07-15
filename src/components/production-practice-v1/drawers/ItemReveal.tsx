import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import type { PracticeItem } from "../types";

/** Kanji · reading badges · speak · gloss — shared across feedback drawers. */
export const ItemReveal = ({ item }: { item: PracticeItem }) => (
  <div className="flex flex-col items-center gap-1 text-foreground">
    <div className="flex flex-wrap items-center justify-center gap-1">
      <span className="text-2xl kanji-font">{item.kanji}</span>
      <span className="mx-1 text-base font-normal">·</span>
      {item.reading.split("・").map((r) => (
        <RomajiBadge key={r} kana={r} />
      ))}
      <SpeakButton word={item.word} iconType="volume-2" />
    </div>
    <p className="text-xs font-bold text-muted-foreground">
      {item.englishGloss || item.keyword}
    </p>
  </div>
);
