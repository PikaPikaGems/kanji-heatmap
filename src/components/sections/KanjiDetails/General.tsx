import { GeneralKanjiItem } from "@/lib/kanji/kanji-info-types";
import { useKanjiInfo } from "@/kanji-worker/kanji-worker-hooks";

import { DefaultErrorFallback } from "@/components/error";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrimaryBadgeWithPopover } from "@/components/dependent/PrimaryBadgeWithPopover";
import { DottedSeparator } from "@/components/ui/dotted-separator";

import { BasicLoading } from "@/components/common/BasicLoading";

import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { ReactNode } from "react";

const hasData = (data?: number) => data != null && data !== -1;

const TableCellFixed = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <TableCell className={`w-24 sm:w-32 ${className ?? ""}`}>
    {children}
  </TableCell>
);

const TableCellGrow = ({ children }: { children: ReactNode }) => (
  <TableCell>{children}</TableCell>
);

export const General = ({ kanji }: { kanji: string }) => {
  const info = useKanjiInfo(kanji, "general");

  if (info.error) {
    return <DefaultErrorFallback message="Failed to load data." />;
  }

  if (info.data == null) {
    return <BasicLoading />;
  }

  const data = info.data as GeneralKanjiItem;

  return (
    <>
      <div className="mt-6 text-left">
        {hasData(data.jouyouGrade) && (
          <PrimaryBadgeWithPopover
            label="Grade"
            value={data.jouyouGrade!}
            description="The Japanese school grade level where this kanji is officially introduced in the jōyō curriculum."
          />
        )}
        {hasData(data.strokes) && (
          <PrimaryBadgeWithPopover
            label="Strokes"
            value={data.strokes!}
            description="The total number of pen strokes used to write the kanji correctly."
          />
        )}
        {hasData(data.wk) && (
          <PrimaryBadgeWithPopover
            label="WK"
            value={data.wk!}
            description="The kanji’s corresponding level in the WaniKani learning system."
          />
        )}
        {hasData(data.rtk) && (
          <PrimaryBadgeWithPopover
            label="RTK"
            value={data.rtk!}
            description="The kanji’s entry number in Remembering the Kanji (RTK) by James Heisig."
          />
        )}
        {hasData(data.kklcIndex) && (
          <PrimaryBadgeWithPopover
            label="KKLC"
            value={data.kklcIndex!}
            description="The kanji’s entry number in the Kodansha Kanji Learner’s Course (KKLC)."
          />
        )}
      </div>
      <DottedSeparator className="my-4 border-b-2" />
      <Table>
        <TableBody>
          <TableRow className="text-left">
            <TableCellFixed>Meanings</TableCellFixed>
            <TableCellGrow>
              {data.meanings.map((meaning) => {
                return (
                  <Badge key={meaning} variant={"outline"} className="m-1">
                    {meaning}
                  </Badge>
                );
              })}

              {data.meanings.length === 0 && <div> - </div>}
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed>Kun Readings</TableCellFixed>
            <TableCellGrow>
              {data.allKun.map((kun) => {
                return <RomajiBadge key={kun} kana={kun} />;
              })}
              {data.allKun.length === 0 && <div> - </div>}
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed>On Readings</TableCellFixed>
            <TableCellGrow>
              {data.allOn.map((on) => {
                return <RomajiBadge key={on} kana={on} />;
              })}
              {data.allOn.length === 0 && <div> - </div>}
            </TableCellGrow>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};
