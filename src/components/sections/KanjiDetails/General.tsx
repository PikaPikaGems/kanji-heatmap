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
import { OrderDisclaimer } from "@/components/common/OrderDisclaimer";
import {
  jitenMoeFn,
  jpdbFn,
  kanshudoFn,
  otherOutLinks,
} from "@/lib/external-links";
import { KanjiActions } from "@/components/dependent/site-wide/KanjiActionBtns";
import { TableCellFixed } from "./TableCellFixed";
import { useIndonesianMeanings } from "@/providers/indonesian-meanings-hooks";
import { useShowIndonesianMeanings } from "@/hooks/use-show-indonesian-meanings";
import { IndonesianMeaningsCredit } from "@/components/common/IndonesianMeaningsCredit";

const hasData = (data?: number) => data != null && data !== -1;

export const TableCellGrow = ({ children }: { children: ReactNode }) => (
  <TableCell className="min-w-0">{children}</TableCell>
);

/** A row label with an ⓘ popover (General Information, Anchor Word). */
export const LabelCell = ({
  label,
  description,
}: {
  label: ReactNode;
  description: ReactNode;
}) => (
  <TableCellFixed className="w-28 text-[10px] uppercase">
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

/** One meaning in the Core Ideas / Indonesian Meanings rows. */
const MeaningBadge = ({ meaning }: { meaning: string }) => (
  <Badge variant={"outline"} className="m-1 whitespace-nowrap">
    {meaning}
  </Badge>
);

/**
 * Only mounted while User Preferences → "Show Indonesian meanings" is on, so
 * the file is never fetched otherwise. Nothing shows while loading, on error,
 * or for a kanji without Indonesian meanings.
 */
const IndonesianMeaningsRow = ({ kanji }: { kanji: string }) => {
  const meanings = useIndonesianMeanings(kanji);

  if (meanings == null) return null;

  return (
    <TableRow className="text-left animate-fade-in-fast">
      <LabelCell
        label="Indonesian Meanings"
        description={
          <>
            Meanings of this kanji in Indonesian. <IndonesianMeaningsCredit />
          </>
        }
      />
      <TableCellGrow>
        <div className="flex flex-wrap gap-1.5">
          {meanings.map((meaning) => (
            <MeaningBadge key={meaning} meaning={meaning} />
          ))}
        </div>
      </TableCellGrow>
    </TableRow>
  );
};

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
  const [showIndonesianMeanings] = useShowIndonesianMeanings();

  if (info.error) {
    return (
      <>
        <BareGeneral kanji={kanji} />
        <div className="flex justify-center gap-1">
          <KanjiActions key={kanji} kanji={kanji} />
        </div>
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
    description: ReactNode;
  }[] = [
    {
      label: "Strokes",
      value: data.strokes,
      description:
        "The total number of pen strokes used to write the kanji correctly.",
    },
    { label: "WK", value: data.wk, description: <OrderDisclaimer /> },
    { label: "KKLC", value: data.kklcIndex, description: <OrderDisclaimer /> },
    { label: "RTK", value: data.rtk, description: <OrderDisclaimer /> },
    {
      label: "TopoKanji",
      value: data.topoTwitterIndex,
      description: (
        <>
          Component-before-compound order, weighted by Twitter frequency. From{" "}
          <ExternalTextLink href={otherOutLinks.topoKanji} text="TopoKanji" />.
        </>
      ),
    },
  ];

  const readingRows: {
    label: string;
    description: ReactNode;
    items: ReactNode[];
  }[] = [
    {
      label: "Core Ideas",
      description: (
        <>
          Words in english associated with this kanji. e.g., 山 →
          &ldquo;mountain&rdquo;, 水 → &ldquo;water&rdquo;
        </>
      ),
      // FIXME: I don't know why 回 has a meaning "#name?"
      items: data.meanings
        .filter((meaning) => meaning !== "#name?")
        .map((meaning) => <MeaningBadge key={meaning} meaning={meaning} />),
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
    {
      label: "Actions",
      description: "Hear, copy, share, or search by this kanji",
      items: [<KanjiActions key={kanji} kanji={kanji} />],
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
      <Table className="table-fixed">
        <TableBody>
          {showIndonesianMeanings && <IndonesianMeaningsRow kanji={kanji} />}
          {readingRows.map(({ label, description, items }) => (
            <TableRow key={label} className="text-left">
              <LabelCell label={label} description={description} />
              <TableCellGrow>
                {items.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">{items}</div>
                ) : (
                  <div> - </div>
                )}
              </TableCellGrow>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};
