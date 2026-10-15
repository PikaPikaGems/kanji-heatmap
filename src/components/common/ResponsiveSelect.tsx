import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import { Label } from "../ui/label";
import BasicSelect from "./BasicSelect";
import { Combobox } from "./Combobox";

export const ResponsiveSelect = ({
  value,
  onChange,
  options,
  label,
  isLabelSrOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
    description?: string;
  }[];
  label: string;
  /** Hide the small built-in label when the caller shows its own heading. */
  isLabelSrOnly?: boolean;
}) => {
  const isTouchDevice = useIsTouchDevice();

  if (isTouchDevice) {
    return (
      <BasicSelect
        value={value}
        onChange={onChange}
        triggerCN={"h-8 w-full rounded-lg"}
        options={options}
        label={label}
        isLabelSrOnly={isLabelSrOnly}
      />
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <Label className={isLabelSrOnly ? "sr-only" : "text-xs font-normal"}>
          {label}
        </Label>
        <Combobox
          value={value}
          setValue={onChange}
          options={options}
          triggerClassName="rounded-lg"
        />
      </div>
      <div className="block sm:hidden">
        <BasicSelect
          value={value}
          onChange={onChange}
          triggerCN={"h-8 w-full rounded-lg"}
          options={options}
          label={label}
          isLabelSrOnly={isLabelSrOnly}
        />
      </div>
    </>
  );
};
