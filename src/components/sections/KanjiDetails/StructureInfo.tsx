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
import {
    useSimilarKanjis,
} from "@/kanji-worker/kanji-worker-hooks";
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
                <h3 className="pt-3 pb-1 pl-3 mb-4 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50">Visually Similar Kanji</h3>
                <div className="flex items-center min-w-0 space-x-2 overflow-x-auto overflow-y-hidden">
                    {dedupe(similars).map((similarKanji) => (
                        <div key={similarKanji} className="shrink-0">
                            <GenericPopover
                                trigger={
                                    <button className="flex flex-col my-1 kanji-font text-3xl border-2 rounded-2xl p-2 border-dotted hover:border-solid hover:border-[#2effff]">
                                        {similarKanji}
                                    </button>
                                }
                                content={<PartComponentLink part={similarKanji} />}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <PrimaryDataSources
                links={[
                    {
                        text: "lennart-finke/kanjidist-visualiser",
                        url: "https://github.com/lennart-finke/kanjidist-visualiser/blob/master/data/dkanjistat.json"
                    },
                    {
                        text: "Yencken, Lars (2010) Orthographic support for passing the reading hurdle in Japanese. PhD Thesis, University of Melbourne, Melbourne, Australia",
                        url: "https://lars.yencken.org/datasets/kanji-confusion/",
                    },
                ]}
            />
        </>
    );
};

export const StructureInfo = ({ kanji }: { kanji: string }) => {
    return (
        <>
            <h3 className="pt-3 pb-1 pl-3 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50">Component Breakdown</h3>
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

            <SimilarKanjis kanji={kanji} />
        </>
    );
}
