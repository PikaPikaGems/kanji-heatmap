import { KanjiInfoFrequency } from "@/lib/kanji/kanji-worker-types";
import { KANJI_COUNT } from "@/lib/options/constants";
import { getFreqCnByRank } from "@/lib/freq/freq-category";
import {
  frequencyRankLabels,
  inverseFreqMap,
} from "@/lib/options/options-label-maps";

import { InfoIcon } from "@/components/icons";

import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { GenericPopover } from "@/components/common/GenericPopover";
import { FreqRankTypeInfo } from "@/components/common/freq/FreqRankTypeInfo";
import { frequencyRankNamesOrdered } from "@/lib/options/options-constants";

export const FrequencyInfo = ({
  freqRankInfo,
}: {
  freqRankInfo?: KanjiInfoFrequency;
}) => {

  if (freqRankInfo == null) {
    return <div className="w-full p-4 text-base text-center">No frequency rank information available.</div>;
  }

  return (
    <div className="ml-2">
      <Table className="my-4">
        <TableBody>
          {frequencyRankNamesOrdered.map((item) => {
            const rank = freqRankInfo[item as keyof KanjiInfoFrequency];
            const label = frequencyRankLabels[item as keyof KanjiInfoFrequency];
            const progress =
              rank == null || rank < 1
                ? 0
                : (Math.max(KANJI_COUNT - rank, 0) * 100) / KANJI_COUNT;

            const category = getFreqCnByRank(rank);
            const freqkey = inverseFreqMap[item as keyof KanjiInfoFrequency];

            return (
              <TableRow key={item} className="p-0 my-1 text-left">
                <TableCell className="p-0">
                  <GenericPopover
                    trigger={
                      <button className="text-left text-xs flex justify-between items-center w-[225px] lg:w-[280px] py-1 ">
                        <span className="font-extrabold">
                          {label}{" "}
                          <InfoIcon className="inline-block" size={12} />
                        </span>{" "}
                        {rank !== -1 && (
                          <span className="inline-block w-12 -mb-0_5 grow text-end">
                            #{rank}
                          </span>
                        )}
                        <span
                          className={`h-3 w-3 inline-block mx-1 ${category}`}
                        />
                      </button>
                    }
                    content={
                      <div className="p-2 w-72">
                        <FreqRankTypeInfo value={freqkey} />
                      </div>
                    }
                  />
                </TableCell>

                <TableCell className={`w-full py-2 px-0`}>
                  <Progress
                    className={"h-1"}
                    value={progress}
                    primitiveCn={"background-theme-color-with-opacity-100"}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
