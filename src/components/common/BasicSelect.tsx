import { ReactNode, useId } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

const BasicSelect = ({
  value,
  onChange,
  options,
  triggerCN,
  selectItemCNFunc,
  label,
  isLabelSrOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  triggerCN?: string;
  selectItemCNFunc?: (v: string) => string;
  options: {
    label: ReactNode;
    value: string;
    disabled?: boolean;
    description?: string;
  }[];
  label: string;
  isLabelSrOnly?: boolean;
}) => {
  const id = useId();

  // <Label /> component used to accessibility
  // https://www.radix-ui.com/primitives/docs/components/select#labelling
  return (
    <>
      <Label
        className={isLabelSrOnly ? "sr-only" : "text-xs font-normal"}
        htmlFor={`select-${id}`}
      >
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`w-full pl-2 ${triggerCN}`}
          id={`select-${id}`}
        >
          <SelectValue>
            {options.find((option) => option.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-w-72 max-h-64 sm:max-h-96 sm:max-w-96 ">
          <SelectGroup>
            {options.map((option) => {
              return (
                <SelectItem
                  className={`block max-w-72 sm:max-w-96 text-left ${selectItemCNFunc?.(option.value)}`}
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  <span className="block w-full font-extrabold">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="block text-xs">{option.description}</span>
                  )}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};

export default BasicSelect;
