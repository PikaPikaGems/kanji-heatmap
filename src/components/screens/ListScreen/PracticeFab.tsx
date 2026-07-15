import { useEffect, useRef, useState } from "react";
import { Eye, Keyboard, NotebookPen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PracticeButton } from "@/components/ui/practice-button";
import { DashedNavLink } from "@/components/common/DashedNavLink";
import { practicePageLinks } from "@/components/items/practice-pages";
import { useBgSrc } from "@/components/dependent/routing/routing-hooks";
import { cn } from "@/lib/utils";

const practiceLinkIcons = {
  "/recognition-practice": Eye,
  "/speed-katakana": Keyboard,
} as const;

const practiceLinks = practicePageLinks.map((page) => ({
  ...page,
  Icon: practiceLinkIcons[page.href],
}));

const prefetchPracticeRoutes = () => {
  void import("@/components/recognition-practice-v1/RecognitionPracticeV1");
  void import("@/components/screens/SpeedKatakanaScreen/SpeedKatakanaScreen");
};

/** True when radix/remove-scroll has locked the body (modals, selects, etc.). */
const isBodyScrollLocked = () => {
  const { body } = document;
  return (
    body.style.overflow === "hidden" ||
    body.style.paddingRight !== "" ||
    body.hasAttribute("data-scroll-locked") ||
    getComputedStyle(body).getPropertyValue("--removed-body-scroll-bar-size").trim() !==
    ""
  );
};

/** Bumps whenever scroll-lock toggles so the FAB can fade instead of hard-jumping. */
const useScrollLockFadeTick = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let prev = isBodyScrollLocked();

    const onChange = () => {
      const next = isBodyScrollLocked();
      if (next === prev) return;
      prev = next;
      setTick((n) => n + 1);
    };

    const observer = new MutationObserver(onChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class", "data-scroll-locked"],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  return tick;
};

export const PracticeFab = () => {
  const [open, setOpen] = useState(false);
  const bgSrc = useBgSrc();
  const hasBgMeaning = bgSrc !== "none";
  const fadeTick = useScrollLockFadeTick();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (fadeTick === 0) return;
    const el = buttonRef.current;
    if (!el) return;
    el.classList.remove("animate-practice-fab-settle");
    // Force reflow so the animation can restart.
    void el.offsetWidth;
    el.classList.add("animate-practice-fab-settle");
  }, [fadeTick]);

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
            "fixed z-40 rounded-full h-[5rem] w-[5rem] p-6 border-b-[8px] active:translate-y-[5px] active:border-b-[3px] [&_svg]:size-10 right-[calc(0.35rem+5px)] bottom-[calc(1rem+env(safe-area-inset-bottom))]",
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
          What do you want to do?
        </p>
        <div className="flex flex-row gap-2">
          {practiceLinks.map((item) => (
            <DashedNavLink
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              Icon={item.Icon}
              onClick={() => setOpen(false)}
              className="flex-1"
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
