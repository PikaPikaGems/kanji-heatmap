import { Suspense } from "react";
import {
  useSearchSettings,
  useSearchSettingsDispatch,
} from "@/providers/search-settings-hooks";
import LazySortAndFilter, {
  SortAndFilterLoadingFallback,
} from "./LazySortAndFilter";

export const SettledSortAndFilter = () => {
  const searchSettings = useSearchSettings();
  const dispatch = useSearchSettingsDispatch();

  return (
    <Suspense fallback={<SortAndFilterLoadingFallback />}>
      <LazySortAndFilter
        initialValue={searchSettings}
        onSettle={(value) => {
          dispatch("filterSettings", value.filterSettings);
          dispatch("sortSettings", value.sortSettings);
        }}
      />
    </Suspense>
  );
};
