import { GeneralKanjiItem } from "@/lib/kanji/kanji-info-types";
import { useKanjiInfo } from "@/kanji-worker/kanji-worker-hooks";

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
import { jitenMoeFn, jpdbFn, kanshudoFn } from "@/lib/external-links";
import { orderDisclaimer } from "@/lib/options/options-label-maps";

const hasData = (data?: number) => data != null && data !== -1;

const TableCellFixed = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <TableCell
    className={`w-28 sm:w-32 text-[10px] uppercase ${className ?? ""}`}
  >
    {children}
  </TableCell>
);

const TableCellGrow = ({ children }: { children: ReactNode }) => (
  <TableCell>{children}</TableCell>
);

const LabelCell = ({
  label,
  description,
}: {
  label: ReactNode;
  description: ReactNode;
}) => (
  <TableCellFixed>
    <GenericPopover
      trigger={
        <span className="cursor-pointer">
          {" "}
          {label}{" "}
          <InfoIcon
            className="inline-block -translate-y-0.5 pl-1 cursor-pointer"
            size={12}
          />{" "}
        </span>
      }
      content={<div className="w-48 px-4 py-3 text-xs">{description}</div>}
    />
  </TableCellFixed>
);

export const BareGeneral = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <div className="w-full p-4 text-base text-center">
        No entry for {kanji} right now. Look it up on
        <ExternalTextLink href={jpdbFn(kanji)} text="JPDB" />,{" "}
        <ExternalTextLink href={jitenMoeFn(kanji)} text="Jiten.Moe" />, or{" "}
        <ExternalTextLink href={kanshudoFn(kanji)} text="Kanshudo" /> instead.
      </div>
    </>
  );
};

export const General = ({ kanji }: { kanji: string }) => {
  const info = useKanjiInfo(kanji, "general");

  if (info.error) {
    return (
      <>
        <BareGeneral kanji={kanji} />
      </>
    );
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
            description={orderDisclaimer}
          />
        )}
        {hasData(data.kklcIndex) && (
          <PrimaryBadgeWithPopover
            label="KKLC"
            value={data.kklcIndex!}
            description={orderDisclaimer}
          />
        )}
        {hasData(data.rtk) && (
          <PrimaryBadgeWithPopover
            label="RTKA"
            value={data.rtk!}
            description={orderDisclaimer}
          />
        )}
        {hasData(data.rtkb) && (
          <PrimaryBadgeWithPopover
            label="RTKB"
            value={data.rtkb!}
            description={orderDisclaimer}
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
              description={
                <>
                  Words in english associated with this kanji. e.g., 山 →
                  &ldquo;mountain&rdquo;, 水 → &ldquo;water&rdquo;
                </>
              }
            />
            <TableCellGrow>
              {/** FIXME: I don't know why 回  has a meaning "#name?" */}
              {data.meanings
                .filter((meaning) => meaning !== "#name?")
                .map((meaning) => {
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
            <LabelCell
              label="Kunyomi"
              description={
                <>
                  Native Japanese readings used in Japanese-origin words. e.g.,
                  山 → <strong>やま</strong> (yama), 水 → <strong>みず</strong>{" "}
                  (mizu)
                </>
              }
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
              description={
                <>
                  Sino-Japanese readings used in compound words. e.g., 山 →{" "}
                  <strong>サン</strong> (san) as in 富士山, 水 →{" "}
                  <strong>スイ</strong> (sui) as in 水泳
                </>
              }
            />
            <TableCellGrow>
              {data.allOn.map((on) => (
                <RomajiBadge key={on} kana={on} />
              ))}
              {data.allOn.length === 0 && <div> - </div>}
            </TableCellGrow>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};
