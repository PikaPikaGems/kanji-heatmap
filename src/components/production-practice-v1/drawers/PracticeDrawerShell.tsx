import { ReactNode } from "react";
import type { FsrsRating } from "engine-contract";
import { PracticeButton } from "@/components/ui/practice-button";
import { RatingButtons } from "@/components/shared-practice";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/** Shared bottom-sheet chrome for production-practice drawers. */
export const PracticeDrawerShell = ({
  open,
  title,
  titleClassName,
  description,
  children,
  footer,
  showHandle = false,
  autoFocus = false,
}: {
  open: boolean;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Top drag-handle pill. Hide on feedback drawers. */
  showHandle?: boolean;
  /** Focus first focusable on open (vaul). See KanjiDrawer. */
  autoFocus?: boolean;
}) => {
  return (
    <Drawer open={open} dismissible={false} autoFocus={autoFocus}>
      <DrawerContent
        showHandle={showHandle}
        className="max-h-[92dvh] border-2 border-t-4 [border-top-style:dashed]"
      >
        <DrawerHeader className="pb-2 text-center">
          <DrawerTitle
            className={`text-lg pb-2 font-bold text-center animate-practice-bounce-soft ${titleClassName ?? ""}`}
          >
            {title}
          </DrawerTitle>
          {description != null && (
            <DrawerDescription asChild>
              <div className="text-sm font-bold text-center text-foreground">
                {description}
              </div>
            </DrawerDescription>
          )}
        </DrawerHeader>
        {children}
        {footer}
      </DrawerContent>
    </Drawer>
  );
};

export const NextKanjiFooter = ({ onNext }: { onNext: () => void }) => (
  <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-md mx-auto w-full">
    <PracticeButton size="lg" onClick={onNext}>
      Next Kanji →
    </PracticeButton>
  </div>
);

/** Mastery game, correct answer: Hard / Good / Easy instead of "Next Kanji". */
export const RatingFooter = ({
  intervals,
  onRate,
}: {
  intervals: Record<FsrsRating, string>;
  onRate: (rating: FsrsRating) => void;
}) => (
  <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-md mx-auto w-full">
    <div className="grid grid-cols-3 gap-2">
      <RatingButtons intervals={intervals} onRate={onRate} />
    </div>
  </div>
);
