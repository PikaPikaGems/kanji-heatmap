import { useState } from "react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { ColorGrid } from "@/components/common/ColorGrid";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export const ChangeThemeColorBtn = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <HoverCard openDelay={0} open={isOpen ? false : undefined}>
      <GenericPopover
        open={isOpen}
        onOpenChange={setIsOpen}
        showArrow={false}
        contentClassName="z-40 w-72 p-3"
        trigger={
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="px-2 text-white rounded-lg h-7 kanji-font background-theme-color-with-opacity-100"
              aria-label="Change theme color"
            >
              色
            </button>
          </HoverCardTrigger>
        }
        content={
          isOpen ? (
            <div className="space-y-2 text-left">
              <ColorGrid />
            </div>
          ) : null
        }
      />
      <HoverCardContent className="p-2 w-auto text-xs">
        Change theme color
      </HoverCardContent>
    </HoverCard>
  );
};
