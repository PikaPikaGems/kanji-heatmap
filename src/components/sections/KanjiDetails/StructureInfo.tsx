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
  otherOutLinks,
  similarKanjiSourceLinks,
  structureSourceLinks,
} from "@/lib/external-links";
import { cnTextLink } from "@/lib/generic-cn";
import { Link } from "@/components/dependent/routing/router-adapter";
import { OriginalKanjiComponentBreakdown } from "./OriginalComponentBreakdown";
import {
  useSimilarKanjis,
  useSphmnKanjiOf,
} from "@/kanji-worker/kanji-worker-hooks";
import { dedupe } from "@/lib/utils";
import { GenericPopover } from "@/components/common/GenericPopover";
import { GlobalKanjiLink } from "@/components/dependent/routing/global-links";
import { useResolvedComponent } from "./use-resolved-component";

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

// Every similar kanji is a kanji, even one outside the main set (which
// PartComponentLink would show as an unlinked part), so always link it.
const SimilarKanjiLink = ({ kanji }: { kanji: string }) => {
  const resolved = useResolvedComponent(kanji);
  return <GlobalKanjiLink kanji={kanji} keyword={resolved?.keyword ?? "..."} />;
};

// A kanji button that opens a popover with its kanji link.
const KanjiPopoverButton = ({ kanji }: { kanji: string }) => (
  <div className="shrink-0">
    <GenericPopover
      trigger={
        <button className="flex flex-col p-2 my-1 text-3xl border-2 border-dotted kanji-font rounded-2xl hover:border-solid hover:border-neon-accent">
          {kanji}
        </button>
      }
      content={
        <div className="p-2">
          <SimilarKanjiLink kanji={kanji} />
        </div>
      }
    />
  </div>
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
            <KanjiPopoverButton key={similarKanji} kanji={similarKanji} />
          ))}
        </div>
      </div>
      <PrimaryDataSources links={similarKanjiSourceLinks} />
    </>
  );
};

const CONTAINED_IN_SHOWN = 30;

const componentSearchHref = (component: string) =>
  `/?search-type=components&search-text=${encodeURIComponent(component)}`;

/**
 * The reverse of the breakdown (寺 → 侍 持 待 …), from sph-mn, in the user's
 * current sort order. "See all" opens component search, which also returns
 * the kanji itself, so the count includes it.
 */
const KanjiThatContain = ({ kanji }: { kanji: string }) => {
  const { data } = useSphmnKanjiOf(kanji);
  const containing = data ?? [];
  if (containing.length === 0) return null;

  return (
    <>
      <div className="text-left animate-fade-in">
        <h3 className="pt-3 pb-1 pl-3 mb-4 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50">
          Kanji that contain {kanji}
        </h3>
        <div className="flex items-center min-w-0 space-x-2 overflow-x-auto overflow-y-hidden">
          {containing.slice(0, CONTAINED_IN_SHOWN).map((other) => (
            <KanjiPopoverButton key={other} kanji={other} />
          ))}
          {containing.length > CONTAINED_IN_SHOWN && (
            <Link
              to={componentSearchHref(kanji)}
              className={`${cnTextLink} shrink-0 px-2 text-sm whitespace-nowrap`}
            >
              See all {containing.length + 1}
            </Link>
          )}
        </div>
      </div>
      <PrimaryDataSources
        links={[
          { text: "sph-mn/nihongo", url: otherOutLinks.sphmnNihongo },
          {
            text: "ScottOglesby/kanji-bakuhatsu",
            url: otherOutLinks.scottKanjiBakuhatsu,
          },
        ]}
      />
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
            <TableCellFixed className="text-[10px] text-muted-foreground">
              (kanjium)
            </TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataKanjium kanji={kanji} />
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed className="text-[10px] text-muted-foreground">
              (hlorenzi)
            </TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataLorenzi kanji={kanji} />
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed className="text-[10px] text-muted-foreground">
              (yagays)
            </TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataYagays kanji={kanji} />
            </TableCellGrow>
          </TableRow>

          <TableRow className="text-left">
            <TableCellFixed className="text-[10px] text-muted-foreground">
              (ScottOglesby)
            </TableCellFixed>
            <TableCellGrow>
              <KanjiStructuralDataScott kanji={kanji} />
            </TableCellGrow>
          </TableRow>
          <TableRow className="text-left">
            <TableCellFixed className="text-[10px] text-muted-foreground">
              (TopoKanji)
            </TableCellFixed>
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

      <KanjiThatContain kanji={kanji} />
    </>
  );
};
