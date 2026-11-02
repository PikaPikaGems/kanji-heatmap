import { useState } from "react";
import { NotebookPen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PracticeButton } from "@/components/ui/practice-button";
import { DashedNavLinkSections } from "@/components/common/DashedNavLinkSections";
import { NotificationDot } from "@/components/common/NotificationDot";
import {
  floatingIslandNavLinks,
  practiceNavSections,
} from "@/lib/pages/nav-links";
import { dueNavHrefs, useVisibleNavSections } from "@/lib/pages/mode-nav-links";
import { totalDue, useDueCount } from "@/lib/engine/use-due-count";
import { useBgSrc } from "@/hooks/routing-hooks";
import { useLocation } from "@/components/dependent/routing/router-hooks";
import { useScrollLockSettleRef } from "@/hooks/use-scroll-lock-fade-tick";
import { cn } from "@/lib/utils";

const fabHrefs = new Set(floatingIslandNavLinks.map((link) => link.href));

const prefetchPracticeRoutes = () => {
  void import("@/components/recognition-practice-v1/RecognitionPracticeV1");
  void import("@/components/production-practice-v1/ProductionPracticeV1");
  void import("@/components/screens/SpeedKatakanaScreen/SpeedKatakanaScreen");
  void import("@/components/screens/FillTheKanjiScreen/FillTheKanjiScreen");
};

export const PracticeFab = () => {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const bgSrc = useBgSrc();
  const hasBgMeaning = bgSrc !== "none";
  // Secondary (contrast) only when the page heatmap bg is meaningful.
  // Today that applies on `/` only. Once `/mastery` ships a heatmap, include
  // it here too. `/dashboard` (and other FAB routes) always stay primary.
  const useSecondaryVariant = location === "/" && hasBgMeaning;

  const buttonRef = useScrollLockSettleRef<HTMLButtonElement>();
  const due = useDueCount();
  const modeSections = useVisibleNavSections(practiceNavSections);

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
          variant={useSecondaryVariant ? "secondary" : "primary"}
          className={cn(
            "fixed-viewport-layer fixed z-40 rounded-full h-[5rem] w-[5rem] p-6 border-b-[8px] active:translate-y-[5px] active:border-b-[3px] [&_svg]:size-10 right-[calc(0.35rem+5px)] bottom-[calc(1rem+env(safe-area-inset-bottom)+var(--bottom-banner-height,0px))]",
            useSecondaryVariant && "border-foreground/40"
          )}
          aria-label="Open practice menu"
          aria-expanded={open}
          onMouseEnter={prefetchPracticeRoutes}
          onFocus={prefetchPracticeRoutes}
        >
          <NotebookPen />
          {totalDue(due) > 0 && (
            <NotificationDot className="absolute top-1/2 left-[calc(50%+1.2rem)] -translate-y-1/2" />
          )}
        </PracticeButton>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="z-50 w-[min(100vw-1.5rem,28rem)] p-3 pt-0"
        aria-label="Practice menu"
      >
        <DashedNavLinkSections
          sections={modeSections}
          dotHrefs={dueNavHrefs(due)}
          listClassName="grid grid-cols-2 gap-2"
          onItemClick={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};
