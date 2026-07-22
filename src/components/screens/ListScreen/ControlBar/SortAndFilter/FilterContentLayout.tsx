import { ReactNode } from "react";
import { FilterX } from "@/components/icons";
import { UppercaseHeading } from "@/components/common/UpperCaseHeading";

export const FilterSectionLayout = ({
  jlptField,
  jouyouGradeField,
  strokeCountField,
  freqRankRangeField,
  freqRankSourceField,
  toggleFiltersField,
}: {
  jlptField: ReactNode;
  jouyouGradeField: ReactNode;
  strokeCountField: ReactNode;
  freqRankSourceField: ReactNode;
  freqRankRangeField?: ReactNode;
  toggleFiltersField?: ReactNode;
}) => {
  return (
    <section className="text-start">
      <UppercaseHeading title="Filters" icon={<FilterX size={15} />} />
      <div className="grid w-full grid-cols-1 gap-4 pb-4 md:grid-cols-2">
        <div>{jlptField}</div>
        <div>{jouyouGradeField}</div>
      </div>

      <div
        className={
          toggleFiltersField != null
            ? "flex w-full flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:gap-8"
            : "pb-4"
        }
      >
        <div className="w-full min-w-0 lg:flex-1">{strokeCountField}</div>
        {toggleFiltersField != null && (
          <div className="flex flex-col w-full min-w-0 sm:flex-row sm:items-center sm:gap-8 lg:flex-1 lg:pt-4">
            {toggleFiltersField}
          </div>
        )}
      </div>
      <div className="py-2 text-xs font-extrabold uppercase md:mt-0">
        Frequency Ranking
      </div>
      <div className="flex flex-col w-full md:flex-row md:space-x-4">
        <div className="w-full md:w-1/2">
          <div className="w-full pb-4 text-left md:pb-0">
            {freqRankSourceField}
          </div>
        </div>
        <div className="w-full pb-8 md:w-1/2">{freqRankRangeField}</div>
      </div>
    </section>
  );
};
