import { lazy, Suspense } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { ErrorBoundary } from "@/components/error";
import { WritingPracticeLoadingScreen } from "@/components/sections/KanjiDetails/StrokeAnimationLoadingScreen";

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
      <ScrollableDialogContent
        size="md"
        title={<span className="text-3xl kanji-font">{kanji}</span>}
        description={`Practice writing stroke order for ${kanji}`}
        headerClassName="pt-4"
        titleClassName="flex items-center text-center"
      >
        <ErrorBoundary details="StrokeAnimation in WritingPracticeModal">
          <Suspense fallback={<WritingPracticeLoadingScreen />}>
            {/* Remount when opened so stroke order restarts from the first stroke. */}
            {open && (
              <StrokeAnimation key={kanji} kanji={kanji} defaultPracticeMode />
            )}
          </Suspense>
        </ErrorBoundary>
      </ScrollableDialogContent>
    </Dialog>
  );
};
