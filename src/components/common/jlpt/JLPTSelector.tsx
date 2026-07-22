import { JLPTOptions, JLTPTtypes } from "@/lib/jlpt";
import { FilterMultiSelect } from "@/components/common/FilterMultiSelect";

const JLPTOptionsWithIcon = JLPTOptions.map((entry) => {
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

export function JLPTSelector({
  selectedJLPT,
  setSelectedJLPT,
}: {
  selectedJLPT: JLTPTtypes[];
  setSelectedJLPT: (v: JLTPTtypes[]) => void;
}) {
  return (
    <FilterMultiSelect
      label="JLPT"
      options={JLPTOptionsWithIcon}
      selectedValues={selectedJLPT}
      onValueChange={setSelectedJLPT}
      placeholder="All levels selected"
    />
  );
}
