import { FREQUENCY_RANK_FILTER_OPTIONS } from "@/lib/options/options-arr";
import {
  FREQ_RANK_SOURCES_INFO,
  rankTypeLabel,
} from "@/lib/freq/freq-source-info";
import { FrequencyType } from "@/lib/options/options-types";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import { Label } from "@/components/ui/label";
import BasicSelect from "../BasicSelect";
import { Combobox } from "../Combobox";
import { FreqRankTypeInfo } from "./FreqRankTypeInfo";

export function FrequencyRankDataSource({
  value,
  setValue,
  label = "Frequency Rank Data Source",
}: {
  value: FrequencyType;
  setValue: (v: FrequencyType) => void;
  label?: string;
}) {
  const isTouchDevice = useIsTouchDevice();

  if (isTouchDevice) {
    return (
      <>
        <BasicSelect
          value={value}
          onChange={(newValue) => setValue(newValue as FrequencyType)}
          triggerCN={"h-8 w-full"}
          options={FREQUENCY_RANK_FILTER_OPTIONS.map((item) => {
            const info = FREQ_RANK_SOURCES_INFO[item.value as FrequencyType];
            return {
              ...item,
              description: `${info.description ?? ""} ${rankTypeLabel[info.rankType]} `,
            };
          })}
          label={label}
          isLabelSrOnly={false}
        />
        <FreqRankTypeInfo value={value} defaultValue={null} />
      </>
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <Label>{label}</Label>
        <Combobox
          value={value}
          setValue={(newValue) => setValue(newValue as FrequencyType)}
          options={FREQUENCY_RANK_FILTER_OPTIONS.map((item) => {
            const info = FREQ_RANK_SOURCES_INFO[item.value as FrequencyType];
            return {
              ...item,
              description: `${info.description ?? ""} ${rankTypeLabel[info.rankType]} `,
            };
          })}
        />
      </div>
      <div className="block sm:hidden">
        <BasicSelect
          value={value}
          onChange={(newValue) => setValue(newValue as FrequencyType)}
          triggerCN={"h-8 w-full"}
          options={FREQUENCY_RANK_FILTER_OPTIONS.map((item) => {
            const info = FREQ_RANK_SOURCES_INFO[item.value as FrequencyType];
            return {
              ...item,
              description: `${info.description ?? ""} ${rankTypeLabel[info.rankType]} `,
            };
          })}
          label={label}
          isLabelSrOnly={false}
        />
      </div>
      <FreqRankTypeInfo value={value} defaultValue={null} />
    </>
  );
}
