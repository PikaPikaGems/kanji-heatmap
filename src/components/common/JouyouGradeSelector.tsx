import { JouyouGradeOptions, JouyouGradeType } from "@/lib/jouyou-grade";
import { FilterMultiSelect } from "@/components/common/FilterMultiSelect";

const JouyouGradeOptionsWithIcon = JouyouGradeOptions.map((entry) => {
  return {
    label: entry.label,
    value: entry.value,
    iconNode: (
      <div
        className={`h-3 w-3 -translate-y-[1px] rounded-sm mr-1 ${entry.cn}`}
      />
    ),
  };
});

export const JouyouGradeSelector = ({
  selectedGrades,
  setSelectedGrades,
}: {
  selectedGrades?: JouyouGradeType[];
  setSelectedGrades: (values: JouyouGradeType[]) => void;
}) => (
  <FilterMultiSelect
    label="Jōyō grade"
    options={JouyouGradeOptionsWithIcon}
    selectedValues={selectedGrades}
    onValueChange={setSelectedGrades}
    placeholder="All grades selected"
  />
);
