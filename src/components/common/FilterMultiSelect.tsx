import { ReactNode, useId } from "react";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";

type FilterOption<T extends string> = {
  label: string;
  value: T;
  iconNode?: ReactNode;
};

export const FilterMultiSelect = <T extends string>({
  label,
  options,
  selectedValues,
  onValueChange,
  placeholder,
}: {
  label: string;
  options: FilterOption<T>[];
  selectedValues?: T[];
  onValueChange: (values: T[]) => void;
  placeholder: string;
}) => {
  const id = useId();
  const fieldId = `${label.toLowerCase().replace(/\s+/g, "-")}-${id}`;

  return (
    <div>
      <Label className="text-xs" htmlFor={fieldId}>
        {label}
      </Label>
      <MultiSelect
        id={fieldId}
        name={fieldId}
        options={options}
        onValueChange={(values) => onValueChange(values as T[])}
        value={selectedValues}
        placeholder={placeholder}
        variant="inverted"
        maxCount={options.length}
        hasSearchInput={false}
      />
    </div>
  );
};
