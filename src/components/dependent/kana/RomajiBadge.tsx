import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { translateValue } from "@/lib/wanakana-adapter";
import { useSpeak } from "@/hooks/use-jp-speak";

export const RomajiBadge = ({ kana }: { kana: string }) => {
  const [isKana, setIsKana] = useState(true);
  const speak = useSpeak(kana);

  const content = isKana ? kana : translateValue(kana, "romaji");
  const cn = isKana ? "kanji-font" : "";
  return (
    <Badge
      variant={"outline"}
      className={`m-1 cursor-pointer text-xl ${cn} hover:bg-[#2effff] hover:text-black`}
      onClick={(e) => {
        setIsKana((prev) => !prev);
        e.preventDefault();
        speak();
      }}
    >
      {content}
    </Badge>
  );
};
