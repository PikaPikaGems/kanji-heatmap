import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useChangeFont } from "@/hooks/use-change-font";

const ChangeFontButton = () => {
  const nextFont = useChangeFont();

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger asChild>
        <Button
          className="px-2 rounded-md h-7 kanji-font"
          variant={"secondary"}
          onClick={nextFont}
          tabIndex={-1}
        >
          字体
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-32 p-2 text-xs">
        Change Kanji Font
      </HoverCardContent>
    </HoverCard>
  );
};

export default ChangeFontButton;
