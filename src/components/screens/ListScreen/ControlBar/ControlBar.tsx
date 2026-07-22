import { Suspense } from "react";
import { ReportBugIconBtn } from "@/components/common/ReportBugIconBtn";

import { SettledSearchInput } from "./SearchInput/SettledSearchInput";
import { SettledSortAndFilter } from "./SortAndFilter/SettledSortAndFilter";
import LazyItemPresentation, {
  ItemPresentationLoadingFallback,
} from "./ItemPresentation/LazyItemPresentation";
import { ErrorBoundary } from "@/components/error";

export const ControlBar = () => {
  return (
    <>
      <ErrorBoundary
        details="SettledSearchInput in ControlBar"
        fallback={
          <div className="h-full flex items-center">
            <ReportBugIconBtn cnOverride="h-9" />
          </div>
        }
      >
        <SettledSearchInput />
      </ErrorBoundary>
      <ErrorBoundary
        details="SettledSortAndFilter in ControlBar"
        fallback={
          <div className="h-full flex items-center">
            <ReportBugIconBtn cnOverride="h-9" />
          </div>
        }
      >
        <SettledSortAndFilter />
      </ErrorBoundary>
      <ErrorBoundary
        details="ItemPresentationSettings in ControlBar"
        fallback={
          <div className="h-full flex items-center">
            <ReportBugIconBtn cnOverride="h-9" />
          </div>
        }
      >
        <Suspense fallback={<ItemPresentationLoadingFallback />}>
          <LazyItemPresentation />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
