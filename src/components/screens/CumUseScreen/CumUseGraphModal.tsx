import { lazy, Suspense } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";
import { CHART_TITLE } from "@/components/sections/KanjiCumUseChart/CumUseChartWrapper";

const LazyCumUseGraphBody = lazy(() => import("./CumUseGraphBody"));

/** The Cumulative Use Graph in a modal, opened from the sidebar. */
export const CumUseGraphModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <ScrollableDialogContent
      className="max-w-5xl"
      title={CHART_TITLE}
      description="Kanji usage against frequency rank"
      titleClassName="text-left"
    >
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyCumUseGraphBody showTitle={false} />
      </Suspense>
    </ScrollableDialogContent>
  </Dialog>
);
