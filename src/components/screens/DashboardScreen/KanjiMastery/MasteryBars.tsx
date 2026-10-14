import { useId, useState } from "react";
import type { ReviewPileItemView } from "engine-contract";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MasteryBarsLegend } from "./MasteryBarsLegend";
import { MasteryCard } from "./MasteryCard";
import {
  JLPT_GROUPING,
  JOUYOU_GROUPING,
  MASTERY_CARD_KINDS,
  tallyMastery,
} from "./mastery-tally";

const METRICS: readonly MasteryMetric[] = ["stability", "difficulty"];

/** JLPT / Jouyou toggle plus the 3 x 2 grid of segmented-bar cards. */
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
  const switchId = useId();

  const grouping = showJouyou ? JOUYOU_GROUPING : JLPT_GROUPING;
  const tallies = tallyMastery(allKanji, pile, getInfo, grouping);

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
        <Label
          htmlFor={switchId}
          className={!showJouyou ? "text-foreground font-semibold" : undefined}
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
      <MasteryBarsLegend />
      <div className="grid gap-3 sm:grid-cols-2">
        {MASTERY_CARD_KINDS.flatMap((kind) =>
          METRICS.map((metric) => (
            <MasteryCard
              key={`${kind}-${metric}`}
              kind={kind}
              metric={metric}
              groups={grouping.groups}
              tallies={tallies}
            />
          ))
        )}
      </div>
    </>
  );
};
