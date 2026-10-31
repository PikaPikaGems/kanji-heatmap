import { DashedNavLinkSections } from "@/components/common/DashedNavLinkSections";
import { moreGamesNavLinks, practiceFabColumns } from "@/lib/pages/nav-links";
import { useVisibleNavSections } from "@/lib/pages/mode-nav-links";

/** Soft filled tiles instead of the dashed boxes; a ring on keyboard focus. */
const TILE_CN =
  "border-0 bg-foreground/[0.04] hover:bg-foreground/10 active:bg-foreground/15 outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:bg-foreground/10";

const MORE_GAMES = [{ heading: "More Games", links: moreGamesNavLinks }];

/**
 * The practice menu: a Practice column and a Mastery ⭐️ column, each with
 * Writing / Reading I / Reading II, then the other games. Builds without
 * the study engine drop the Mastery column, and Practice takes the width.
 */
export const PracticeFabMenu = ({
  dotHrefs,
  onItemClick,
}: {
  /** Hrefs that show the due dot. */
  dotHrefs: ReadonlySet<string>;
  onItemClick: () => void;
}) => {
  const columns = useVisibleNavSections(practiceFabColumns);

  return (
    <>
      <div className="grid grid-flow-col auto-cols-fr gap-x-2">
        <DashedNavLinkSections
          sections={columns}
          dotHrefs={dotHrefs}
          listClassName="grid gap-2"
          itemClassName={TILE_CN}
          hideDescriptions
          onItemClick={onItemClick}
        />
      </div>
      <DashedNavLinkSections
        sections={MORE_GAMES}
        listClassName="grid grid-cols-2 gap-2"
        itemClassName={TILE_CN}
        hideDescriptions
        onItemClick={onItemClick}
      />
    </>
  );
};
