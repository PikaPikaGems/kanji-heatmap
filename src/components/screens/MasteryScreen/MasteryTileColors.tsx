import { ReactNode } from "react";
import type { Kanji, ReviewPileItemView } from "engine-contract";
import {
  TileColor,
  TileColorContext,
} from "@/components/sections/KanjiHoverItem/tile-color-context";
import { getBandFillCn, getBandTextCn } from "@/lib/engine/mastery-colors";
import {
  getHeatmapBand,
  getHeatmapMeasure,
  type HeatmapMetric,
} from "@/lib/engine/mastery-heatmap-metrics";
import { useReviewPileByKanji } from "@/lib/engine/use-review-pile";
import { useHeatmapMetric } from "./use-heatmap-metric";

type TileColorLookup = (kanji: Kanji) => TileColor;

// The pile map is stable between store updates, so a lookup built for it and
// a metric keeps its identity: tiles only re-render when the pile or the
// metric changes (no useMemo).
const lookupsByPile = new WeakMap<
  ReadonlyMap<Kanji, ReviewPileItemView>,
  Map<HeatmapMetric, TileColorLookup>
>();

const getLookup = (
  pile: ReadonlyMap<Kanji, ReviewPileItemView>,
  metric: HeatmapMetric
): TileColorLookup => {
  const byMetric = lookupsByPile.get(pile) ?? new Map();
  lookupsByPile.set(pile, byMetric);
  const cached = byMetric.get(metric);
  if (cached) return cached;

  const measure = getHeatmapMeasure(metric);
  const lookup: TileColorLookup = (kanji) => {
    // Read per tile, not when the lookup is built: mastery levels depend on
    // the clock, and the lookup lives as long as the pile snapshot.
    const band = getHeatmapBand(metric, pile.get(kanji), Date.now());
    return {
      bgCn: getBandFillCn(measure, band),
      textCn: getBandTextCn(measure, band),
    };
  };
  byMetric.set(metric, lookup);
  return lookup;
};

/** Colors the tiles below by the picked metric instead of by frequency. */
export const MasteryTileColors = ({ children }: { children: ReactNode }) => {
  const [metric] = useHeatmapMetric();
  const { byKanji } = useReviewPileByKanji();

  return (
    <TileColorContext.Provider value={getLookup(byKanji, metric)}>
      {children}
    </TileColorContext.Provider>
  );
};
