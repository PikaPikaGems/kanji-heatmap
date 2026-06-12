import { useState } from "react";
import wanakana from "@/lib/wanakana-adapter";
import { Button } from "@/components/ui/button";
import { SpanBadge } from "@/components/ui/badge";
import { badgeCn } from "@/components/ui/badge-utils";

const useHiraganaWordButton = (rawKana: string) => {
  const [showRomaji, setShowRomaji] = useState(false);
  const fontCss = !showRomaji ? "kanji-font" : "romaji-font";
  const kana = showRomaji
    ? wanakana.toRomaji(rawKana.split(",")[0])
    : rawKana.split(",")[0];

  return { kana, fontCss, onToggle: () => setShowRomaji((prev) => !prev) };
};

export const HiraganaWord = ({
  rawKana,
  highlightIndex,
  spanCn = "",
  btnCn = "",
}: {
  rawKana: string;
  highlightIndex: number;
  spanCn?: string;
  btnCn?: string;
}) => {
  const { kana, fontCss, onToggle } = useHiraganaWordButton(rawKana);

  return (
    <Button
      variant="ghost"
      className={`flex px-1 z-0 ${fontCss} ${btnCn}`}
      onClick={onToggle}
    >
      {kana.split(" ").map((mora, index) => {
        const key = `${mora}-${index}`;

        if (index === highlightIndex) {
          return (
            <SpanBadge
              className={`${badgeCn} text-md md:text-lg ${spanCn}`}
              key={key}
            >
              {mora}
            </SpanBadge>
          );
        }

        return (
          <span className={`text-md md:text-lg ${spanCn}`} key={key}>
            {mora}
          </span>
        );
      })}
    </Button>
  );
};
