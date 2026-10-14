import { Suspense } from "react";

import { SettledSearchInput } from "./SearchInput/SettledSearchInput";
import { SettledSortAndFilter } from "./SortAndFilter/SettledSortAndFilter";
import LazyItemPresentation, {
  ItemPresentationLoadingFallback,
  type ItemPresentationPopover,
} from "./ItemPresentation/LazyItemPresentation";
import { ErrorBoundary } from "@/components/error";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import { SearchInputErrorFallback } from "./SearchInput/SearchInputErrorFallback";

/**
 * `Popover` is the lazy item-presentation popover: /mastery swaps in its own,
 * whose background-color section picks a mastery metric.
 */
export const ControlBar = ({
  Popover,
}: {
  Popover: ItemPresentationPopover;
}) => {
  return (
    <>
      <ErrorBoundary
        details="SettledSearchInput in ControlBar"
        fallback={<SearchInputErrorFallback />}
      >
        <SettledSearchInput />
      </ErrorBoundary>
      <ErrorBoundary
        details="SettledSortAndFilter in ControlBar"
        fallback={
          <div className="flex items-center h-9">
            <RefreshPageBtn />
          </div>
        }
      >
        <SettledSortAndFilter />
      </ErrorBoundary>
      <ErrorBoundary
        details="ItemPresentationSettings in ControlBar"
        fallback={
          <div className="flex items-center h-9">
            <RefreshPageBtn />
          </div>
        }
      >
        <Suspense fallback={<ItemPresentationLoadingFallback />}>
          <LazyItemPresentation Popover={Popover} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
