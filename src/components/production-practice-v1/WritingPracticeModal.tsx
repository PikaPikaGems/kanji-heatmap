import { lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorBoundary } from "@/components/error";
import { StrokeAnimationLoadingScreen } from "@/components/sections/KanjiDetails/StrokeAnimationLoadingScreen";

const StrokeAnimation = lazy(
  () => import("@/components/sections/KanjiDetails/StrokeAnimation")
);

export const WritingPracticeModal = ({
  open,
  onOpenChange,
  kanji,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanji: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[96dvh] overflow-y-auto px-4 py-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center text-center">
            <span className="text-3xl kanji-font">{kanji}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Practice writing stroke order for {kanji}
          </DialogDescription>
        </DialogHeader>
        <ErrorBoundary details="StrokeAnimation in WritingPracticeModal">
          <Suspense fallback={<StrokeAnimationLoadingScreen />}>
            {/* Remount when opened so stroke order restarts from the first stroke. */}
            {open && (
              <StrokeAnimation key={kanji} kanji={kanji} defaultPracticeMode />
            )}
          </Suspense>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};
