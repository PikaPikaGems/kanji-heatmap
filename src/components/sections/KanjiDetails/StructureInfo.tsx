
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import {
    KanjiStructuralDataLorenzi,
    KanjiStructuralDataKanjium,
    KanjiStructuralDataYagays,
    KanjiStructuralDataScott,
} from "@/components/sections/KanjiDetails/StructuralCategory";
import { ReactNode } from "react";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";

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
            <Table>
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
                </TableBody>
            </Table>

            <div className="mx-4 mt-3 text-[10px] uppercase font-bold text-left">Primary Data Sources:</div>
            <ul className="mx-6 mb-6 italic text-left list-disc">
                <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/mifunetoshiro/kanjium/blob/master/data/source_files/kanjidict.txt"} text="mifunetoshiro/kanjium" /> (kanjium)</li>
                <li className="ml-6">🐙 <ExternalTextLink href={"https://raw.githubusercontent.com/hlorenzi/jisho-open/main/backend/src/data/kanji_structural_category.ts"} text="hlorenzi/jisho-open" /> (hlorenzi)</li>
                <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/yagays/kanjivg-radical/blob/master/data/kanji2radical.json"} text="yagays/kanjivg-radical" /> (yagays)</li>
                <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/ScottOglesby/kanji-bakuhatsu/blob/master/raw/kanji-composition-map.txt"} text="ScottOglesby/kanji-bakuhatsu" /> (ScottOglesby)</li>
            </ul>
        </>
    );
}
