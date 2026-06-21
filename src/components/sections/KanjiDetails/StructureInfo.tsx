
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import {
    KanjiStructuralDataLorenzi,
    KanjiStructuralDataKanjium,
    KanjiStructuralDataYagays,
    KanjiStructuralDataScott,
} from "@/components/sections/KanjiDetails/StructuralCategory";
import { ReactNode } from "react";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import { OriginalKanjiComponentBreakdown } from "./OriginalComponentBreakdown";

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

export const StructureInfo = ({ kanji }: { kanji: string }) => {


    return (
        <>
            <Table key={kanji} className="border-b animate-fade-in ">
                <TableBody>
                    <TableRow className="text-left">
                        <TableCellFixed>(kanjium)</TableCellFixed>
                        <TableCellGrow>
                            <KanjiStructuralDataKanjium kanji={kanji} />
                        </TableCellGrow>
                    </TableRow>
                    <TableRow className="text-left">
                        <TableCellFixed>
                            (hlorenzi)
                        </TableCellFixed>
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
                            <OriginalKanjiComponentBreakdown kanji={kanji} showNotAvailable={true} />
                        </TableCellGrow>
                    </TableRow>
                </TableBody>
            </Table>

            <PrimaryDataSources
                links={[
                    { text: "mifunetoshiro/kanjium", url: "https://github.com/mifunetoshiro/kanjium/blob/master/data/source_files/kanjidict.txt" },
                    { text: "hlorenzi/jisho-open", url: "https://raw.githubusercontent.com/hlorenzi/jisho-open/main/backend/src/data/kanji_structural_category.ts" },
                    { text: "yagays/kanjivg-radical", url: "https://github.com/yagays/kanjivg-radical/blob/master/data/kanji2radical.json" },
                    { text: "ScottOglesby/kanji-bakuhatsu", url: "https://github.com/ScottOglesby/kanji-bakuhatsu/blob/master/raw/kanji-composition-map.txt" },
                    { text: "scriptin/topokanji", url: "https://github.com/scriptin/topokanji" },
                ]}
            />
        </>
    );
}
