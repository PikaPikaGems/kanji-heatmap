import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import { Label } from "../ui/label";
import BasicSelect from "./BasicSelect";
import { Combobox } from "./Combobox";

export const ResponsiveSelect = ({
  value,
  onChange,
  options,
  label,
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
}) => {
  const isTouchDevice = useIsTouchDevice();

  if (isTouchDevice) {
    return (
      <BasicSelect
        value={value}
        onChange={onChange}
        triggerCN={"h-8 w-full"}
        options={options}
        label={label}
        isLabelSrOnly={false}
      />
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <Label className={"text-xs font-normal"}>{label}</Label>
        <Combobox value={value} setValue={onChange} options={options} />
      </div>
      <div className="block sm:hidden">
        <BasicSelect
          value={value}
          onChange={onChange}
          triggerCN={"h-8 w-full"}
          options={options}
          label={label}
          isLabelSrOnly={false}
        />
      </div>
    </>
  );
};
