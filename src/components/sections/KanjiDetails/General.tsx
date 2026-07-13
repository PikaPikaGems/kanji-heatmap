import { GeneralKanjiItem } from "@/lib/kanji/kanji-info-types";
import {
  useGetKanjiInfoFn,
  useKanjiInfo,
  useSimilarKanjis,
} from "@/kanji-worker/kanji-worker-hooks";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrimaryBadgeWithPopover } from "@/components/dependent/PrimaryBadgeWithPopover";
import { DottedSeparator } from "@/components/ui/dotted-separator";

import { BasicLoading } from "@/components/common/BasicLoading";

import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { ReactNode } from "react";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { PrimaryDataSources } from "@/components/common/PrimaryDataSources";
import { jitenMoeFn, jpdbFn, kanshudoFn } from "@/lib/external-links";
import { GlobalKanjiLink } from "@/components/dependent/routing";

const hasData = (data?: number) => data != null && data !== -1;

const TableCellFixed = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <TableCell className={`w-28 sm:w-32 text-[10px] uppercase ${className ?? ""}`}>
    {children}
  </TableCell>
);

const TableCellGrow = ({ children }: { children: ReactNode }) => (
  <TableCell>{children}</TableCell>
);

const LabelCell = ({ label, description }: { label: ReactNode; description: ReactNode }) => (
  <TableCellFixed>

    <GenericPopover
      trigger={<span className="cursor-pointer"> {label} <InfoIcon className="inline-block -translate-y-0.5 pl-1 cursor-pointer" size={12} /> </span>}
      content={<div className="w-48 px-4 py-3 text-xs">{description}</div>}
    />
  </TableCellFixed>
);

export const BareGeneral = ({ kanji }: { kanji: string }) => {

  return (
    <>
      <div className="w-full p-4 text-base text-center">No entry for {kanji} right now. Look it up on
        <ExternalTextLink href={jpdbFn(kanji)} text="JPDB" />, <ExternalTextLink href={jitenMoeFn(kanji)} text="Jiten.Moe" />,  or <ExternalTextLink href={kanshudoFn(kanji)} text="Kanshudo" /> instead.
      </div>
    </>
  )

}
const SimilarKanjiRow = ({ kanji }: { kanji: string }) => {
  const similar = useSimilarKanjis(kanji);
  const getKanjiInfo = useGetKanjiInfoFn();
  const similars = similar.data ?? [];
  const showEmpty = similar.status !== "loading" && similars.length === 0;

  return (
    <TableRow className="text-left">
      <LabelCell
        label="Similar"
        description={
          <>
            Kanji that look visually similar to this one. Useful for spotting
            lookalikes you might confuse while reading or writing.
          </>
        }
      />
      <TableCell className="w-full max-w-0">
        {similars.length > 0 ? (
          <div className="flex min-w-0 items-center space-x-2 overflow-x-auto overflow-y-hidden">
            {similars.map((similarKanji) => (
              <div key={similarKanji} className="shrink-0">
                <GlobalKanjiLink

                  fontSize="text-6xl"
                  kanji={similarKanji}
                  keyword={getKanjiInfo?.(similarKanji)?.keyword ?? "..."}
                />
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          <div> - </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
};

export const General = ({ kanji }: { kanji: string }) => {
  const info = useKanjiInfo(kanji, "general");

  if (info.error) {
    return <>
      <BareGeneral kanji={kanji} />
    </>
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
            description="The kanji's corresponding level in the WaniKani learning system."
          />
        )}
        {hasData(data.rtk) && (
          <PrimaryBadgeWithPopover
            label="RTK"
            value={data.rtk!}
            description="The kanji's entry number in Remembering the Kanji (RTK) by James Heisig."
          />
        )}
        {hasData(data.kklcIndex) && (
          <PrimaryBadgeWithPopover
            label="KKLC"
            value={data.kklcIndex!}
            description="The kanji's entry number in the Kodansha Kanji Learner's Course (KKLC)."
          />
        )}
        <JLPTBadge jlpt={data.jlpt} />
      </div>
      <DottedSeparator className="my-4 border-b-2" />
      <Table>
        <TableBody>
          <TableRow className="text-left">
            <LabelCell
              label="Meanings"
              description={<>Words in english associated with this kanji. e.g., 山 → &ldquo;mountain&rdquo;, 水 → &ldquo;water&rdquo;</>}
            />
            <TableCellGrow>
              {/** FIXME: I don't know why 回  has a meaning "#name?" */}
              {data.meanings.filter(meaning => meaning !== "#name?").map((meaning) => {
                return (
                  <Badge key={meaning} variant={"outline"} className="m-1">
                    {meaning}
                  </Badge>
                )
              })}
              {data.meanings.length === 0 && <div> - </div>}
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <LabelCell
              label="Kunyomi"
              description={<>Native Japanese readings used in Japanese-origin words. e.g., 山 → <strong>やま</strong> (yama), 水 → <strong>みず</strong> (mizu)</>}
            />
            <TableCellGrow>
              {data.allKun.map((kun) => (
                <RomajiBadge key={kun} kana={kun} />
              ))}
              {data.allKun.length === 0 && <div> - </div>}
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <LabelCell
              label="Onyomi"
              description={<>Sino-Japanese readings used in compound words. e.g., 山 → <strong>サン</strong> (san) as in 富士山, 水 → <strong>スイ</strong> (sui) as in 水泳</>}
            />
            <TableCellGrow>
              {data.allOn.map((on) => (
                <RomajiBadge key={on} kana={on} />
              ))}
              {data.allOn.length === 0 && <div> - </div>}
            </TableCellGrow>
          </TableRow>
          <SimilarKanjiRow kanji={kanji} />
        </TableBody>
      </Table>
      <PrimaryDataSources
        links={[
          {
            text: "Yencken, Lars (2010) Orthographic support for passing the reading hurdle in Japanese. PhD Thesis, University of Melbourne, Melbourne, Australia",
            url: "https://lars.yencken.org/datasets/kanji-confusion/",
          },
        ]}
      />
    </>
  );
};
