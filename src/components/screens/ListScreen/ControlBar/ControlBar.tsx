import { lazy, Suspense } from "react";
import KaoMojiLoadingSpinner from "@/components/common/KaomojiLoading";
import { ReportBugIconBtn } from "@/components/common/ReportBugIconBtn";

import ItemPresentationSettingsPopover from "./ItemPresentation/ItemPresentationPopover";
import { SettledSearchInput } from "./SearchInput/SettledSearchInput";
import { SettledSortAndFilter } from "./SortAndFilter/SettledSortAndFilter";
import { ErrorBoundary } from "@/components/error";

const ItemPresentationSettingsContent = lazy(() =>
  import("./ItemPresentation/ItemPresentationContent").then((m) => ({
    default: m.ItemPresentationSettingsContent,
  }))
);

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
        <ItemPresentationSettingsPopover>
          <ErrorBoundary details="ItemPresentationSettingsContent in ControlBar">
            <Suspense
              fallback={
                <div
                  className="py-8 text-sm text-center text-muted-foreground"
                  role="status"
                >
                  <KaoMojiLoadingSpinner />
                  Loading...
                </div>
              }
            >
              <ItemPresentationSettingsContent />
            </Suspense>
          </ErrorBoundary>
        </ItemPresentationSettingsPopover>
      </ErrorBoundary>
    </>
  );
};
