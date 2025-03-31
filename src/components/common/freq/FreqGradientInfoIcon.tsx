import {
  FreqCategory,
  freqCategoryCn,
  freqCategoryCount,
  freqRankMaxMin,
  getFreqCategory,
} from "@/lib/freq/freq-category";
import { cnItemBg } from "@/lib/generic-cn";
import { FreqSquare } from "./FreqSquare";
import { GenericPopover } from "../GenericPopover";
import { InfoIcon } from "@/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const FreqGradientInfoIcon = () => {
  getFreqCategory();
  return (
    <GenericPopover
      trigger={<InfoIcon className="inline-block" size={16} />}
      content={
        <div>
          <div className="text-xs w-60 px-4 pt-4 text-left">
            More common kanji appear brighter, while rarer ones are duller,
            based on your chosen frequency data source.
          </div>
          <Table className="text-xs m-auto my-2 text-center w-fit">
            <TableHeader>
              <TableRow>
                <TableHead className="p-1 h-4">Color</TableHead>
                <TableHead className="p-1 h-4">Min Rank</TableHead>
                <TableHead className="p-1 h-4">Max Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: freqCategoryCount }).map((_, index) => {
                const item = freqCategoryCount - index - 1;
                const cn = `${freqCategoryCn[item as FreqCategory]} ${cnItemBg}`;

                return (
                  <TableRow key={item}>
                    <TableCell className="py-2">
                      <FreqSquare key={item} srOnly={item.toString()} cn={cn} />
                    </TableCell>
                    <TableCell className="py-2">
                      {freqRankMaxMin[item as FreqCategory].min}
                    </TableCell>
                    <TableCell className="py-2">
                      {freqRankMaxMin[item as FreqCategory].max}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      }
    />
  );
};
