import { useId, useState } from "react";
import type { ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MasteryBarsLegend } from "./MasteryBarsLegend";
import { MasteryCard } from "./MasteryCard";
import { MasteryMetricToggle } from "./MasteryMetricToggle";
import {
  JLPT_GROUPING,
  JOUYOU_GROUPING,
  MASTERY_CARD_KINDS,
  tallyMastery,
} from "./mastery-tally";

/** JLPT / Jouyou and metric toggles, one legend, and a segmented-bar card per card kind. */
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
  const switchId = useId();

  const grouping = showJouyou ? JOUYOU_GROUPING : JLPT_GROUPING;
  // Read at render: levels shift over weeks, so no ticking timer is needed.
  const tallies = tallyMastery(allKanji, pile, getInfo, grouping, Date.now());

  return (
    <>
      <div className="flex flex-wrap items-center justify-center mb-3 gap-x-6 gap-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Label
            htmlFor={switchId}
            className={
              !showJouyou ? "text-foreground font-semibold" : undefined
            }
          >
            JLPT
          </Label>
          <Switch
            id={switchId}
            checked={showJouyou}
            onCheckedChange={setShowJouyou}
            aria-label="Toggle between JLPT and Jouyou grade breakdown"
          />
          <Label
            htmlFor={switchId}
            className={showJouyou ? "text-foreground font-semibold" : undefined}
          >
            Jouyou
          </Label>
        </div>
        <MasteryMetricToggle value={metric} onChange={setMetric} />
      </div>
      <MasteryBarsLegend metric={metric} />
      <div className="grid gap-3 md:grid-cols-3">
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
    </>
  );
};
