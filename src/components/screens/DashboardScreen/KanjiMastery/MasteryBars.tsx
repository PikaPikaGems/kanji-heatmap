import { useState } from "react";
import type { ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import type {
  MasteryCardKind,
  MasteryMetric,
} from "@/lib/engine/mastery-metrics";
import { MasteryScaleLegend } from "@/components/screens/MasteryScreen/MasteryLegend";
import { MeasureIntro } from "@/components/screens/MasteryScreen/MeasureIntro";
import { TwoWaySwitch } from "../TwoWaySwitch";
import { MasteryCard } from "./MasteryCard";
import {
  MasteryKindFilters,
  type MasteryKindFilter,
} from "./MasteryKindFilters";
import {
  JLPT_GROUPING,
  JOUYOU_GROUPING,
  MASTERY_CARD_KINDS,
  tallyMastery,
} from "./mastery-tally";

/** Cards side by side on wider screens: one column per card shown (four as 2 × 2). */
const GRID_COLUMNS_CN = [
  "",
  "",
  "md:grid-cols-2",
  "md:grid-cols-3",
  "md:grid-cols-2",
];

/**
 * One measure's statistics: what it means (its ⓘ opens the bands), the
 * card-type checkboxes, a card of bars per level (and "All") for each card
 * type shown, the color scale, and the JLPT / Jouyou switch under it all.
 * Tapping a bar opens its breakdown.
 */
export const MasteryBars = ({
  metric,
  shownKinds,
  onKindChange,
  pile,
  allKanji,
  getInfo,
  hasSecondaryWord,
}: {
  metric: MasteryMetric;
  shownKinds: MasteryKindFilter;
  onKindChange: (kind: MasteryCardKind, checked: boolean) => void;
  pile: readonly ReviewPileItemView[];
  allKanji: readonly string[];
  getInfo: GetBasicKanjiInfo;
  hasSecondaryWord: (kanji: string) => boolean;
}) => {
  const [showJouyou, setShowJouyou] = useState(false);

  const grouping = showJouyou ? JOUYOU_GROUPING : JLPT_GROUPING;
  // Read at render: levels shift over weeks, so no ticking timer is needed.
  const tallies = tallyMastery(
    allKanji,
    pile,
    getInfo,
    hasSecondaryWord,
    grouping,
    Date.now()
  );
  const kinds = MASTERY_CARD_KINDS.filter((kind) => shownKinds[kind]);

  return (
    <>
      <div className="flex justify-center mb-3">
        <MeasureIntro
          measure={metric}
          combined={true}
          className="text-center text-balance"
        />
      </div>
      <MasteryKindFilters shown={shownKinds} onChange={onKindChange} />
      <div
        key={`${showJouyou ? "jouyou" : "jlpt"}-${kinds.join("-")}`}
        className={`grid gap-3 animate-fade-in-fast ${GRID_COLUMNS_CN[kinds.length]}`}
      >
        {kinds.map((kind) => (
          <MasteryCard
            key={kind}
            kind={kind}
            metric={metric}
            groups={grouping.groups}
            tallies={tallies}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <MasteryScaleLegend measure={metric} className="mt-4 mb-0" />
      </div>
      <TwoWaySwitch
        className="mt-4"
        left="JLPT"
        right="Jouyou"
        checked={showJouyou}
        onCheckedChange={setShowJouyou}
        ariaLabel="Toggle between JLPT and Jouyou grade breakdown"
      />
    </>
  );
};
