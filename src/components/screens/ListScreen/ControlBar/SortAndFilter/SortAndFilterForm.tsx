import { SORT_ORDER_SELECT } from "@/lib/options/options-arr";
import { SearchSettings } from "@/lib/settings/settings";

import { PracticeButton } from "@/components/ui/practice-button";

import { FreqRankTypeInfo } from "@/components/common/freq/FreqRankTypeInfo";
import { StrokeCountField } from "@/components/common/StrokeCountField";
import { JLPTSelector } from "@/components/common/jlpt/JLPTSelector";
import { JouyouGradeSelector } from "@/components/common/JouyouGradeSelector";
import { FrequencyRankDataSource } from "@/components/common/freq/FrequencyRankDataSource";
import { FrequencyRankingRangeField } from "@/components/common/freq/FrequencyRankingRangeField";

import { FilterSectionLayout } from "./FilterContentLayout";
import { FilterToggleRow } from "./FilterToggleRow";
import { ItemCount } from "./ItemCount";
import {
  SortAdditionalInfo,
  SortOrderSectionLayout,
} from "./SortOrderPresentation";
import { ResponsiveSelect } from "@/components/common/ResponsiveSelect";
import {
  isCommunityOrder,
  orderDisclaimer,
} from "@/lib/options/options-label-maps";
import { useSortAndFilterForm } from "./use-sort-and-filter-form";

export const SortAndFilterSettingsForm = ({
  initialValue,
  onSettle,
}: {
  onSettle: (x: SearchSettings) => void;
  initialValue: SearchSettings;
}) => {
  const form = useSortAndFilterForm(initialValue);
  const { sortValues, filterValues, isDisabled, isClearDisabled, isGroup } =
    form;

  return (
    <form
      className="flex flex-col flex-1 min-h-0"
      onSubmit={(e) => {
        e.preventDefault();
        onSettle(form.buildSettings());
      }}
    >
      <div className="flex-1 min-h-0 px-2 space-y-4 overflow-y-auto">
        <SortOrderSectionLayout
          primaryField={
            <>
              <ResponsiveSelect
                value={sortValues.primary}
                onChange={form.setPrimarySort}
                options={SORT_ORDER_SELECT}
                label="Primary"
              />
              <div key={sortValues.primary} className="animate-fade-in">
                <FreqRankTypeInfo
                  value={sortValues.primary}
                  defaultValue={null}
                />
              </div>
              {isCommunityOrder(sortValues.primary) && (
                <div
                  key={`disclaimer-${sortValues.primary}`}
                  className="px-3 mt-1 text-xs text-left animate-fade-in"
                >
                  {orderDisclaimer}
                </div>
              )}
            </>
          }
          secondaryField={
            sortValues.secondary &&
            isGroup && (
              <div className="animate-fade-in">
                <ResponsiveSelect
                  value={sortValues.secondary}
                  onChange={form.setSecondarySort}
                  options={SORT_ORDER_SELECT.filter((item) => {
                    return item.value !== sortValues.primary;
                  })}
                  label="Secondary"
                />
                <div key={sortValues.secondary} className="animate-fade-in">
                  <FreqRankTypeInfo
                    value={sortValues.secondary}
                    defaultValue={null}
                  />
                </div>
                {isCommunityOrder(sortValues.secondary) && (
                  <div
                    key={`disclaimer-${sortValues.secondary}`}
                    className="px-3 mt-1 text-xs text-left animate-fade-in"
                  >
                    {orderDisclaimer}
                  </div>
                )}
              </div>
            )
          }
          additionalInfo={
            <SortAdditionalInfo
              key={`${sortValues.primary}-${sortValues.secondary}`}
              val1={sortValues.primary}
              val2={sortValues.secondary}
            />
          }
        />

        <FilterSectionLayout
          strokeCountField={
            <StrokeCountField
              values={[
                filterValues.strokeRange.min,
                filterValues.strokeRange.max,
              ]}
              setValues={form.setStrokeRange}
            />
          }
          jlptField={
            <JLPTSelector
              selectedJLPT={filterValues.jlpt}
              setSelectedJLPT={form.setJlpt}
            />
          }
          jouyouGradeField={
            <JouyouGradeSelector
              selectedGrades={filterValues.jouyouGrade}
              setSelectedGrades={form.setJouyouGrade}
            />
          }
          freqRankSourceField={
            <FrequencyRankDataSource
              value={filterValues.freq.source}
              setValue={form.setFreqSource}
            />
          }
          freqRankRangeField={
            filterValues.freq.source !== "none" && (
              <div className="animate-fade-in">
                <FrequencyRankingRangeField
                  values={[
                    filterValues.freq.rankRange.min,
                    filterValues.freq.rankRange.max,
                  ]}
                  setValues={form.setFreqRankRange}
                />
              </div>
            )
          }
          toggleFiltersField={
            <>
              <FilterToggleRow
                id="filter-bookmarked-only"
                label="Bookmarked only"
                checked={filterValues.bookmarkedOnly}
                onChange={form.setBookmarkedOnly}
              />
              <FilterToggleRow
                id="filter-anchor-words-only"
                label="With anchor words only"
                checked={filterValues.withAnchorWordsOnly}
                onChange={form.setWithAnchorWordsOnly}
              />
            </>
          }
        />
      </div>
      <div className="px-2 pt-4 mt-4 border-t">
        <div className="flex min-h-12 items-center justify-end">
          {!isDisabled ? (
            <div key="item-count" className="w-full animate-fade-in-slow">
              <ItemCount
                settings={{ ...initialValue, filterSettings: filterValues }}
              />
            </div>
          ) : (
            <div
              key="no-changes"
              className="flex w-full items-center justify-end text-xs animate-fade-in-slow"
            >
              There are no changes to apply yet.
            </div>
          )}
        </div>
        <div className="flex justify-end px-0 pt-2 space-x-1">
          <PracticeButton
            variant="secondary"
            disabled={isClearDisabled}
            onClick={(e) => {
              e.preventDefault();
              form.resetToDefaults();
              e.stopPropagation();
            }}
          >
            Clear all
          </PracticeButton>
          <PracticeButton disabled={isDisabled} type="submit">
            Apply
          </PracticeButton>
        </div>
      </div>
    </form>
  );
};
