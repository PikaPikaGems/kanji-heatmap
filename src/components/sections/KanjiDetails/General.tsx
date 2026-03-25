import { GeneralKanjiItem } from "@/lib/kanji/kanji-info-types";
import { useKanjiInfo } from "@/kanji-worker/kanji-worker-hooks";

import { DefaultErrorFallback } from "@/components/error";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DottedSeparator } from "@/components/ui/dotted-separator";

import { BasicLoading } from "@/components/common/BasicLoading";

import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import {
  KanjiStructuralData,
} from "@/components/sections/KanjiDetails/StructuralCategory";
import { ReactNode } from "react";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";

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
          <Badge className="m-1">Grade {data.jouyouGrade}</Badge>
        )}
        {hasData(data.strokes) && (
          <Badge className="m-1">Strokes {data.strokes}</Badge>
        )}
        {hasData(data.wk) && <Badge className="m-1">Wanikani {data.wk}</Badge>}
        {hasData(data.rtk) && <Badge className="m-1">RTK {data.rtk}</Badge>}
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

          <TableRow className="text-left">
            <TableCellFixed>
              Structure (hlorenzi)
            </TableCellFixed>
            <TableCellGrow>

              <KanjiStructuralData kanji={kanji} />
            </TableCellGrow>
          </TableRow>
        </TableBody>
      </Table>

      <div className="mx-4 mt-12 text-xs font-bold text-left">📌 Notes:</div>
      <div className="mx-6 mb-12 italic text-left">Structure (hlorenzi) is sourced from
        <ExternalTextLink href={"https://github.com/hlorenzi/jisho-open"} text="hlorenzi/jisho-open" /> with
        minimal modifications.
      </div>
    </>
  );
};
