import { useState } from "react";
import { FrequencyType, SortKey } from "@/lib/options/options-types";
import { isEqualFilters } from "@/lib/results-utils";
import { MAX_FREQ_RANK, MAX_STROKE_COUNT } from "@/lib/options/constants";
import { GROUP_OPTIONS } from "@/lib/options/options-constants";
import {
  defaultFilterSettings,
  defaultSortSettings,
} from "@/lib/settings/search-settings-adapter";
import { SearchSettings } from "@/lib/settings/settings";
import { JLTPTtypes } from "@/lib/jlpt";
import { JouyouGradeType } from "@/lib/jouyou-grade";

const isGroupSort = (sortKey: string) =>
  (GROUP_OPTIONS as readonly string[]).includes(sortKey);

/**
 * Local state + typed setters for the sort/filter form. The setters own the
 * cross-field rules: picking a primary sort resets an incompatible secondary,
 * and clearing the frequency source resets its rank range.
 */
export const useSortAndFilterForm = (initialValue: SearchSettings) => {
  const [sortValues, setSortValues] = useState(initialValue.sortSettings);
  const [filterValues, setFilterValues] = useState(initialValue.filterSettings);

  const setPrimarySort = (newValue: string) => {
    setSortValues((prev) => {
      // The secondary only survives when the new primary is a grouping sort
      // and doesn't collide with it.
      const newSecondary =
        newValue === prev.secondary
          ? "none"
          : isGroupSort(newValue)
            ? prev.secondary
            : "none";
      return {
        ...prev,
        primary: newValue as SortKey,
        secondary: newSecondary,
      };
    });
  };

  const setSecondarySort = (newValue: string) => {
    setSortValues((prev) => ({ ...prev, secondary: newValue as SortKey }));
  };

  const setStrokeRange = (val: (number | undefined)[]) => {
    setFilterValues((prev) => ({
      ...prev,
      strokeRange: { min: val[0] ?? 0, max: val[1] ?? MAX_STROKE_COUNT },
    }));
  };

  const setJlpt = (val: JLTPTtypes[]) => {
    setFilterValues((prev) => ({ ...prev, jlpt: val }));
  };

  const setJouyouGrade = (val: JouyouGradeType[]) => {
    setFilterValues((prev) => ({ ...prev, jouyouGrade: val }));
  };

  const setFreqSource = (val: string) => {
    setFilterValues((prev) => ({
      ...prev,
      freq: {
        ...prev.freq,
        source: val as FrequencyType,
        // No source means the range is meaningless — snap it back to full.
        rankRange:
          val === "none" ? { min: 1, max: MAX_FREQ_RANK } : prev.freq.rankRange,
      },
    }));
  };

  const setFreqRankRange = (val: (number | undefined)[]) => {
    setFilterValues((prev) => ({
      ...prev,
      freq: {
        ...prev.freq,
        rankRange: { min: val[0] ?? 1, max: val[1] ?? MAX_FREQ_RANK },
      },
    }));
  };

  const setBookmarkedOnly = (val: boolean) => {
    setFilterValues((prev) => ({ ...prev, bookmarkedOnly: val }));
  };

  const setWithAnchorWordsOnly = (val: boolean) => {
    setFilterValues((prev) => ({ ...prev, withAnchorWordsOnly: val }));
  };

  const resetToDefaults = () => {
    setSortValues(defaultSortSettings);
    setFilterValues(defaultFilterSettings);
  };

  const noChangeInSortValues =
    sortValues.primary === initialValue.sortSettings.primary &&
    sortValues.secondary == initialValue.sortSettings.secondary;

  const noChangeInFilterValues = isEqualFilters(
    initialValue.filterSettings,
    filterValues
  );

  const isDisabled = noChangeInFilterValues && noChangeInSortValues;
  const isClearDisabled =
    sortValues.primary === defaultSortSettings.primary &&
    sortValues.secondary === defaultSortSettings.secondary &&
    isEqualFilters(filterValues, defaultFilterSettings);
  const isGroup = isGroupSort(sortValues.primary);

  const buildSettings = (): SearchSettings => ({
    ...initialValue,
    filterSettings: filterValues,
    sortSettings: sortValues,
  });

  return {
    sortValues,
    filterValues,
    isDisabled,
    isClearDisabled,
    isGroup,
    setPrimarySort,
    setSecondarySort,
    setStrokeRange,
    setJlpt,
    setJouyouGrade,
    setFreqSource,
    setFreqRankRange,
    setBookmarkedOnly,
    setWithAnchorWordsOnly,
    resetToDefaults,
    buildSettings,
  };
};
