import { useState } from "react";
import type { ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { MasteryScaleLegend } from "@/components/screens/MasteryScreen/MasteryLegend";
import { MeasureIntro } from "@/components/screens/MasteryScreen/MeasureIntro";
import { TwoWaySwitch } from "../TwoWaySwitch";
import { MasteryCard, MasteryTotalsCard } from "./MasteryCard";
import {
  JLPT_GROUPING,
  JOUYOU_GROUPING,
  MASTERY_CARD_KINDS,
  tallyMastery,
} from "./mastery-tally";

/**
 * One measure's statistics: what it means (its ⓘ opens the bands), the
 * all-kanji totals per card type, a card of bars per level for each card
 * type, the color scale, and the JLPT / Jouyou switch under it all. Every
 * bar opens its breakdown when tapped.
 */
export const MasteryBars = ({
  metric,
  pile,
  allKanji,
  getInfo,
}: {
  metric: MasteryMetric;
  pile: readonly ReviewPileItemView[];
  allKanji: readonly string[];
  getInfo: GetBasicKanjiInfo;
}) => {
  const [showJouyou, setShowJouyou] = useState(false);

  const grouping = showJouyou ? JOUYOU_GROUPING : JLPT_GROUPING;
  // Read at render: levels shift over weeks, so no ticking timer is needed.
  const tallies = tallyMastery(allKanji, pile, getInfo, grouping, Date.now());

  return (
    <>
      <div className="flex justify-center mb-3">
        <MeasureIntro
          measure={metric}
          combined={true}
          className="text-center text-balance"
        />
      </div>
      <MasteryTotalsCard metric={metric} tallies={tallies} />
      <div
        key={showJouyou ? "jouyou" : "jlpt"}
        className="grid gap-3 mt-3 md:grid-cols-3 animate-fade-in-fast"
      >
        {MASTERY_CARD_KINDS.map((kind) => (
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
