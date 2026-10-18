import { useState } from "react";
import type { ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import {
  MASTERY_METRIC_TITLES,
  MASTERY_METRICS,
  type MasteryMetric,
} from "@/lib/engine/mastery-metrics";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SegmentedTabsList } from "@/components/ui/segmented-tabs";
import { MasteryScaleLegend } from "@/components/screens/MasteryScreen/MasteryLegend";
import { MeasureIntro } from "@/components/screens/MasteryScreen/MeasureIntro";
import { TwoWaySwitch } from "../TwoWaySwitch";
import { MasteryCard } from "./MasteryCard";
import {
  JLPT_GROUPING,
  JOUYOU_GROUPING,
  MASTERY_CARD_KINDS,
  tallyMastery,
} from "./mastery-tally";

const isMasteryMetric = (value: string): value is MasteryMetric =>
  MASTERY_METRICS.some((metric) => metric === value);

/**
 * The Mastery / Stability / Difficulty tabs, then what the picked metric
 * means (its ⓘ opens the bands), a card of thin segmented bars per card kind,
 * the color scale, and the JLPT / Jouyou switch under it all.
 */
export const MasteryBars = ({
  pile,
  allKanji,
  getInfo,
}: {
  pile: readonly ReviewPileItemView[];
  allKanji: readonly string[];
  getInfo: GetBasicKanjiInfo;
}) => {
  const [showJouyou, setShowJouyou] = useState(false);
  const [metric, setMetric] = useState<MasteryMetric>("mastery");

  const grouping = showJouyou ? JOUYOU_GROUPING : JLPT_GROUPING;
  // Read at render: levels shift over weeks, so no ticking timer is needed.
  const tallies = tallyMastery(allKanji, pile, getInfo, grouping, Date.now());

  return (
    <Tabs
      value={metric}
      onValueChange={(next) => {
        if (isMasteryMetric(next)) setMetric(next);
      }}
    >
      <div className="flex justify-center mb-4">
        <SegmentedTabsList
          value={metric}
          label="Kanji mastery metric"
          className="w-full max-w-sm"
          options={MASTERY_METRICS.map((value) => ({
            value,
            label: MASTERY_METRIC_TITLES[value],
          }))}
        />
      </div>
      {MASTERY_METRICS.map((value) => (
        <TabsContent key={value} value={value} className="mt-0">
          <div
            key={grouping === JLPT_GROUPING ? "jlpt" : "jouyou"}
            className="animate-fade-in-fast"
          >
            <div className="flex justify-center mb-3">
              <MeasureIntro
                measure={value}
                combined={true}
                className="text-center text-balance"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {MASTERY_CARD_KINDS.map((kind) => (
                <MasteryCard
                  key={kind}
                  kind={kind}
                  metric={value}
                  groups={grouping.groups}
                  tallies={tallies}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <MasteryScaleLegend measure={value} className="mt-4 mb-0" />
            </div>
          </div>
        </TabsContent>
      ))}
      <TwoWaySwitch
        className="mt-4"
        left="JLPT"
        right="Jouyou"
        checked={showJouyou}
        onCheckedChange={setShowJouyou}
        ariaLabel="Toggle between JLPT and Jouyou grade breakdown"
      />
    </Tabs>
  );
};
