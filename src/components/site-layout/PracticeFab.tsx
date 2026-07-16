import { useState } from "react";
import { NotebookPen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PracticeButton } from "@/components/ui/practice-button";
import { DashedNavLinkList } from "@/components/common/DashedNavLinkList";
import {
  floatingIslandNavLinks,
  practiceNavLinks,
} from "@/components/items/nav-links";
import { useBgSrc } from "@/components/dependent/routing/routing-hooks";
import { useLocation } from "@/components/dependent/routing/router-adapter";
import { useScrollLockSettleRef } from "@/hooks/use-scroll-lock-fade-tick";
import { cn } from "@/lib/utils";

const fabHrefs = new Set(floatingIslandNavLinks.map((link) => link.href));

const prefetchPracticeRoutes = () => {
  void import("@/components/recognition-practice-v1/RecognitionPracticeV1");
  void import("@/components/production-practice-v1/ProductionPracticeV1");
  void import("@/components/screens/SpeedKatakanaScreen/SpeedKatakanaScreen");
};

export const PracticeFab = () => {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const bgSrc = useBgSrc();
  const hasBgMeaning = bgSrc !== "none";
  const buttonRef = useScrollLockSettleRef<HTMLButtonElement>();

  if (!fabHrefs.has(location)) {
    return null;
  }

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) prefetchPracticeRoutes();
      }}
    >
      <PopoverTrigger asChild>
        <PracticeButton
          ref={buttonRef}
          size="icon"
          variant={hasBgMeaning ? "secondary" : "primary"}
          className={cn(
            "fixed z-40 rounded-full h-[5rem] w-[5rem] p-6 border-b-[8px] active:translate-y-[5px] active:border-b-[3px] [&_svg]:size-10 right-[calc(0.35rem+5px+env(safe-area-inset-right,0px))] bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            hasBgMeaning && "border-foreground/40"
          )}
          aria-label="Open practice menu"
          aria-expanded={open}
          onMouseEnter={prefetchPracticeRoutes}
          onFocus={prefetchPracticeRoutes}
        >
          <NotebookPen />
        </PracticeButton>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="z-50 w-[min(100vw-1.5rem,28rem)] p-3"
      >
        <p className="px-1 mb-2 text-sm font-semibold text-left">
          Select a mode
        </p>
        <DashedNavLinkList
          items={practiceNavLinks}
          className="grid grid-cols-2 gap-2"
          onItemClick={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};
