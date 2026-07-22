import { JouyouGradeOptions, JouyouGradeType } from "@/lib/jouyou-grade";
import { FilterMultiSelect } from "@/components/common/FilterMultiSelect";

export const JouyouGradeSelector = ({
  selectedGrades,
  setSelectedGrades,
}: {
  selectedGrades?: JouyouGradeType[];
  setSelectedGrades: (values: JouyouGradeType[]) => void;
}) => (
  <FilterMultiSelect
    label="Jōyō grade"
    options={JouyouGradeOptions}
    selectedValues={selectedGrades}
    onValueChange={setSelectedGrades}
    placeholder="All grades selected"
  />
);
