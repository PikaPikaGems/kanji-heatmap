import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import {
  KanjiStructuralDataLorenzi,
  KanjiStructuralDataKanjium,
  KanjiStructuralDataYagays,
  KanjiStructuralDataScott,
} from "@/components/sections/KanjiDetails/StructuralCategory";
import { ReactNode } from "react";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import {
  similarKanjiSourceLinks,
  structureSourceLinks,
} from "@/lib/external-links";
import { OriginalKanjiComponentBreakdown } from "./OriginalComponentBreakdown";
import { useSimilarKanjis } from "@/kanji-worker/kanji-worker-hooks";
import { dedupe } from "@/lib/utils";
import { GenericPopover } from "@/components/common/GenericPopover";
import { PartComponentLink } from "./PartComponentLink";

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

const SimilarKanjis = ({ kanji }: { kanji: string }) => {
  const similar = useSimilarKanjis(kanji);
  const similars = similar.data ?? [];
  const showEmpty = similar.status !== "loading" && similars.length === 0;

  if (showEmpty || similars.length === 0) return null;
  return (
    <>
      <div className="text-left animate-fade-in">
        <h3 className="pt-3 pb-1 pl-3 mb-4 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50">
          Visually Similar Kanji
        </h3>
        <div className="flex items-center min-w-0 space-x-2 overflow-x-auto overflow-y-hidden">
          {dedupe(similars).map((similarKanji) => (
            <div key={similarKanji} className="shrink-0">
              <GenericPopover
                trigger={
                  <button className="flex flex-col my-1 kanji-font text-3xl border-2 rounded-2xl p-2 border-dotted hover:border-solid hover:border-neon-accent">
                    {similarKanji}
                  </button>
                }
                content={
                  <div className="p-2">
                    <PartComponentLink part={similarKanji} />
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>
      <PrimaryDataSources links={similarKanjiSourceLinks} />
    </>
  );
};

export const StructureInfo = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <h3 className="pt-3 pb-1 pl-3 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50">
        Component Breakdown
      </h3>
      <Table key={kanji} className="border-b animate-fade-in ">
        <TableBody>
          <TableRow className="text-left">
            <TableCellFixed>(kanjium)</TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataKanjium kanji={kanji} />
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed>(hlorenzi)</TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataLorenzi kanji={kanji} />
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed>(yagays)</TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataYagays kanji={kanji} />
            </TableCellGrow>
          </TableRow>

          <TableRow className="text-left">
            <TableCellFixed>(ScottOglesby)</TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataScott kanji={kanji} />
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed>(TopoKanji)</TableCellFixed>
            <TableCellGrow>
              <OriginalKanjiComponentBreakdown
                kanji={kanji}
                showNotAvailable={true}
              />
            </TableCellGrow>
          </TableRow>
        </TableBody>
      </Table>

      <PrimaryDataSources links={structureSourceLinks} />

      <SimilarKanjis kanji={kanji} />
    </>
  );
};
