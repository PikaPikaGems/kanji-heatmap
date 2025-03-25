import React from "react";

import { ReportBugIconBtn } from "@/components/common/ReportBugIconBtn";

import ItemPresentationSettingsPopover from "./ItemPresentation/ItemPresentationPopover";
import { ItemPresentationSettingsContent } from "./ItemPresentation/ItemPresentationContent";
import { SettledSearchInput } from "./SearchInput/SettledSearchInput";
import { SettledSortAndFilter } from "./SortAndFilter/SettledSortAndFilter";
import { ErrorBoundary } from "@/components/error";
import { ItemCountBadge } from "./ItemCountBadge";

export const ControlBarRaw = () => {
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
        <div className="absolute top-12">
          <ItemCountBadge />
        </div>
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
            <ItemPresentationSettingsContent />
          </ErrorBoundary>
        </ItemPresentationSettingsPopover>
      </ErrorBoundary>
    </>
  );
};

export const ControlBar = React.memo(ControlBarRaw);
