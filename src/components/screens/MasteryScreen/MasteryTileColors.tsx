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
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { useHeatmapMetric } from "./use-heatmap-metric";

type TileColorLookup = (kanji: Kanji) => TileColor;

type CachedLookup = {
  getInfo: GetBasicKanjiInfo | null;
  lookup: TileColorLookup;
};

// The pile map is stable between store updates, so a lookup built for it and
// a metric keeps its identity: tiles only re-render when the pile, the
// metric or the kanji info changes (no useMemo).
const lookupsByPile = new WeakMap<
  ReadonlyMap<Kanji, ReviewPileItemView>,
  Map<HeatmapMetric, CachedLookup>
>();

const getLookup = (
  pile: ReadonlyMap<Kanji, ReviewPileItemView>,
  metric: HeatmapMetric,
  getInfo: GetBasicKanjiInfo | null
): TileColorLookup => {
  const byMetric = lookupsByPile.get(pile) ?? new Map();
  lookupsByPile.set(pile, byMetric);
  const cached = byMetric.get(metric);
  if (cached && cached.getInfo === getInfo) return cached.lookup;

  const measure = getHeatmapMeasure(metric);
  const lookup: TileColorLookup = (kanji) => {
    // Read per tile, not when the lookup is built: mastery levels depend on
    // the clock, and the lookup lives as long as the pile snapshot.
    const band = getHeatmapBand(metric, pile.get(kanji), Date.now());
    const info = getInfo?.(kanji);
    return {
      bgCn: getBandFillCn(measure, band),
      textCn: getBandTextCn(band),
      // No anchor word to study it with.
      dimmed: info != null && info.repWord == null,
    };
  };
  byMetric.set(metric, { getInfo, lookup });
  return lookup;
};

/** Colors the tiles below by the picked metric instead of by frequency. */
export const MasteryTileColors = ({ children }: { children: ReactNode }) => {
  const [metric] = useHeatmapMetric();
  const { byKanji } = useReviewPileByKanji();
  const getInfo = useGetKanjiInfoFn();

  return (
    <TileColorContext.Provider value={getLookup(byKanji, metric, getInfo)}>
      {children}
    </TileColorContext.Provider>
  );
};
