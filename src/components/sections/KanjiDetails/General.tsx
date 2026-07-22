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
import { JouyouGradeBadge } from "@/components/common/JouyouGradeBadge";
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

  const indexBadges: {
    label: string;
    value?: number;
    description: string;
  }[] = [
    {
      label: "Strokes",
      value: data.strokes,
      description:
        "The total number of pen strokes used to write the kanji correctly.",
    },
    { label: "WK", value: data.wk, description: orderDisclaimer },
    { label: "KKLC", value: data.kklcIndex, description: orderDisclaimer },
    { label: "RTK", value: data.rtk, description: orderDisclaimer },
    { label: "RTKB", value: data.rtkb, description: orderDisclaimer },
  ];

  const readingRows: {
    label: string;
    description: ReactNode;
    items: ReactNode[];
  }[] = [
    {
      label: "Meanings",
      description: (
        <>
          Words in english associated with this kanji. e.g., 山 →
          &ldquo;mountain&rdquo;, 水 → &ldquo;water&rdquo;
        </>
      ),
      // FIXME: I don't know why 回 has a meaning "#name?"
      items: data.meanings
        .filter((meaning) => meaning !== "#name?")
        .map((meaning) => (
          <Badge key={meaning} variant={"outline"} className="m-1">
            {meaning}
          </Badge>
        )),
    },
    {
      label: "Kunyomi",
      description: (
        <>
          Native Japanese readings used in Japanese-origin words. e.g., 山 →{" "}
          <strong>やま</strong> (yama), 水 → <strong>みず</strong> (mizu)
        </>
      ),
      items: data.allKun.map((kun) => (
        <RomajiBadge key={kun} kana={kun} className="text-lg" />
      )),
    },
    {
      label: "Onyomi",
      description: (
        <>
          Sino-Japanese readings used in compound words. e.g., 山 →{" "}
          <strong>サン</strong> (san) as in 富士山, 水 → <strong>スイ</strong>{" "}
          (sui) as in 水泳
        </>
      ),
      items: data.allOn.map((on) => (
        <RomajiBadge key={on} className="text-lg" kana={on} />
      )),
    },
  ];

  return (
    <>
      <div className="mt-6 text-left">
        <JLPTBadge jlpt={data.jlpt} />
        {hasData(data.jouyouGrade) && (
          <JouyouGradeBadge jouyouGrade={data.jouyouGrade!} />
        )}
        {indexBadges.map(({ label, value, description }) =>
          hasData(value) ? (
            <PrimaryBadgeWithPopover
              key={label}
              label={label}
              value={value!}
              description={description}
            />
          ) : null
        )}
      </div>
      <DottedSeparator className="my-4 border-b-2" />
      <Table>
        <TableBody>
          {readingRows.map(({ label, description, items }) => (
            <TableRow key={label} className="text-left">
              <LabelCell label={label} description={description} />
              <TableCellGrow>
                {items}
                {items.length === 0 && <div> - </div>}
              </TableCellGrow>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};
