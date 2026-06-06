
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import {
    KanjiStructuralDataLorenzi,
    KanjiStructuralDataKanjium,
    KanjiStructuralDataYagays,
    KanjiStructuralDataScott,
} from "@/components/sections/KanjiDetails/StructuralCategory";
import { ReactNode } from "react";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { useIsKanjiWorkerReady, useKanjiInfo } from "@/kanji-worker/kanji-worker-hooks";
import { HoverItemReturnData } from "@/lib/kanji/kanji-info-types";
import { SingleKanjiPart } from "@/components/dependent/site-wide/SingleKanjiPart";
import { CardLoadingScreen } from "@/components/common/CardLoadingScreen";
import { DefaultErrorFallback } from "@/components/error";

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

const OriginalKanjiComponentBreakdown = ({ kanji }: { kanji: string }) => {

    const data = useKanjiInfo(kanji, "hover-card");
    const ready = useIsKanjiWorkerReady();

    if (data.error) {
        return <DefaultErrorFallback message="Failed to load data." />;
    }

    if (!ready || data.status === "loading" || data.data == null) {
        return <CardLoadingScreen />;
    }

    const info = data.data as HoverItemReturnData;

    const parts = info.parts
        .filter((item) => item.part !== kanji)
        .filter((item) => item.part !== info.phonetic?.phonetic);

    const hasParts = parts.length > 0 || info.phonetic;

    return <>
        {hasParts && (
            <div className="flex flex-wrap gap-2 text-left">
                {parts.map((item) => (
                    <SingleKanjiPart
                        key={item.part}
                        kanji={item.part}
                        keyword={item.keyword}
                        isKanji={item.isKanji}
                    />
                ))}
                {info.phonetic && (
                    <SingleKanjiPart
                        kanji={info.phonetic.phonetic}
                        keyword={info.phonetic.keyword}
                        phonetics={info.phonetic.sound}
                        isKanji={info.phonetic.isKanji}
                    />
                )}
            </div>
        )}</>
}

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
                        <TableCellFixed>(KHD)</TableCellFixed>
                        <TableCellGrow>
                            <OriginalKanjiComponentBreakdown kanji={kanji} />
                        </TableCellGrow>
                    </TableRow>
                </TableBody>
            </Table>

            <div className="mx-4 mt-6 text-[10px] uppercase font-bold text-left">Primary Data Sources:</div>
            <ul className="mx-6 mb-6 italic text-left list-disc">
                <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/mifunetoshiro/kanjium/blob/master/data/source_files/kanjidict.txt"} text="mifunetoshiro/kanjium" /></li>
                <li className="ml-6">🐙 <ExternalTextLink href={"https://raw.githubusercontent.com/hlorenzi/jisho-open/main/backend/src/data/kanji_structural_category.ts"} text="hlorenzi/jisho-open" /></li>
                <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/yagays/kanjivg-radical/blob/master/data/kanji2radical.json"} text="yagays/kanjivg-radical" /></li>
                <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/ScottOglesby/kanji-bakuhatsu/blob/master/raw/kanji-composition-map.txt"} text="ScottOglesby/kanji-bakuhatsu" /></li>
                <li className="ml-6">🐙 <ExternalTextLink href={"https://github.com/pikapikagems/kanji-heatmap-data"} text="PikaPikaGems/kanji-heatmap-data" /></li>

            </ul>
        </>
    );
}
