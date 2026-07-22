import { Suspense } from "react";

import { SettledSearchInput } from "./SearchInput/SettledSearchInput";
import { SettledSortAndFilter } from "./SortAndFilter/SettledSortAndFilter";
import LazyItemPresentation, {
  ItemPresentationLoadingFallback,
} from "./ItemPresentation/LazyItemPresentation";
import { ErrorBoundary } from "@/components/error";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import { SearchInputErrorFallback } from "./SearchInput/SearchInputErrorFallback";

export const ControlBar = () => {
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
          <LazyItemPresentation />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
