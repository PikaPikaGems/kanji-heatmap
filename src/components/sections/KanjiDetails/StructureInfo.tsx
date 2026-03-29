
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import {
    KanjiStructuralData,
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
            <Table className="mt-8">
                <TableBody>
                    <TableRow className="text-left">
                        <TableCellFixed>Structure (1)</TableCellFixed>
                        <TableCellGrow>
                            N / A
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
            <div className="mx-6 mb-12 italic text-left">Structure (hlorenzi: is sourced from
                <ExternalTextLink href={"https://github.com/hlorenzi/jisho-open"} text="hlorenzi/jisho-open" /> with
                minimal modifications.
            </div>
        </>
    );
};
