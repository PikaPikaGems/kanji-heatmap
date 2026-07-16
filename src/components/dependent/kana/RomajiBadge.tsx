import { useState } from "react";
import { badgeVariants } from "@/components/ui/badge-utils";
import { cn } from "@/lib/utils";
import { translateValue } from "@/lib/wanakana-adapter";
import { useSpeak } from "@/hooks/use-jp-speak";

export const RomajiBadge = ({ kana }: { kana: string }) => {
  const [isKana, setIsKana] = useState(true);
  const speak = useSpeak(kana);

  const content = isKana ? kana : translateValue(kana, "romaji");

  return (
    <button
      type="button"
      className={cn(
        badgeVariants({ variant: "outline" }),
        "m-1 py-2 px-3 cursor-pointer text-2xl whitespace-nowrap",
        "hover:bg-[#2effff] hover:text-black",
        "outline-none focus:outline-none focus:ring-0",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isKana && "kanji-font"
      )}
      aria-label={`Play reading and toggle kana or romaji for ${kana}`}
      aria-pressed={!isKana}
      onClick={() => {
        setIsKana((prev) => !prev);
        speak();
      }}
    >
      {content}
    </button>
  );
};
