import {
  frequencyRankLabels,
  inverseFreqMap,
} from "@/lib/options/options-label-maps";
import { GenericPopover } from "@/components/common/GenericPopover";
import { badgeCnOutline } from "@/components/ui/badge-utils";
import { cnSquare } from "@/lib/generic-cn";
import { FreqRankTypeInfo } from "@/components/common/freq/FreqRankTypeInfo";
import { colorMap, freqKeyMap } from "./helpers";

export const KeyLegend = ({ freqKey }: { freqKey: string }) => {
  const infoKey = freqKeyMap[freqKey];
  const config = {
    label: frequencyRankLabels[infoKey],
    color: colorMap[freqKey],
  };

  return (
    <GenericPopover
      trigger={
        <button
          className={`${badgeCnOutline} text-nowrap my-1 mx-1 !px-3 !py-2 rounded-xl hover:bg-neon-accent hover:text-black`}
        >
          <span
            className={`block h-4 w-4 ${cnSquare} mx-1`}
            style={{ backgroundColor: config.color }}
          />
          {config.label}
        </button>
      }
      content={
        <div className="px-4 py-3 w-64">
          <FreqRankTypeInfo value={inverseFreqMap[infoKey]} />
        </div>
      }
    />
  );
};
