import { ReactNode } from "react";
import type { Kanji, ReviewPileItemView } from "engine-contract";
import {
  TileColor,
  TileColorContext,
} from "@/components/sections/KanjiHoverItem/tile-color-context";
import { getBandFillCn, getBandTextCn } from "@/lib/engine/mastery-colors";
import {
  getHeatmapBand,
  getHeatmapCardKind,
  getHeatmapMeasure,
  type HeatmapMetric,
} from "@/lib/engine/mastery-heatmap-metrics";
import {
  useGetAnchorIndexFn,
  type GetAnchorIndex,
} from "@/providers/kanji-representative-word-hooks";
import { useReviewPileByKanji } from "@/lib/engine/use-review-pile";
import { useBookmarkedKanji } from "@/lib/engine/use-kanji-sets";
import {
  BOOKMARKED_FILL_CN,
  useHeatmapMetric,
  useHighlightBookmarked,
} from "./use-heatmap-metric";

type TileColorLookup = (kanji: Kanji) => TileColor;

type CachedLookup = {
  getAnchor: GetAnchorIndex | null;
  /** The bookmarks to paint solid, or null when the highlight is off. */
  bookmarked: ReadonlySet<Kanji> | null;
  lookup: TileColorLookup;
};

// The pile map is stable between store updates, so a lookup built for it and
// a metric keeps its identity: tiles only re-render when the pile, the
// metric, the anchor index or the highlighted bookmarks change (no useMemo).
const lookupsByPile = new WeakMap<
  ReadonlyMap<Kanji, ReviewPileItemView>,
  Map<HeatmapMetric, CachedLookup>
>();

/**
 * Kanji a metric has nothing to color: no main anchor word (no cards at
 * all), or, for the Reading II metrics, no secondary word.
 */
const hasNoCardFor = (
  kanji: Kanji,
  metric: HeatmapMetric,
  getAnchor: GetAnchorIndex | null
): boolean => {
  if (getAnchor == null) return false;
  const anchor = getAnchor(kanji);
  if (anchor == null) return true;
  return (
    getHeatmapCardKind(metric) === "secondaryReading" && anchor.secondary === ""
  );
};

const getLookup = (
  pile: ReadonlyMap<Kanji, ReviewPileItemView>,
  metric: HeatmapMetric,
  getAnchor: GetAnchorIndex | null,
  bookmarked: ReadonlySet<Kanji> | null
): TileColorLookup => {
  const byMetric = lookupsByPile.get(pile) ?? new Map();
  lookupsByPile.set(pile, byMetric);
  const cached = byMetric.get(metric);
  if (
    cached &&
    cached.getAnchor === getAnchor &&
    cached.bookmarked === bookmarked
  ) {
    return cached.lookup;
  }

  const measure = getHeatmapMeasure(metric);
  const lookup: TileColorLookup = (kanji) => {
    if (bookmarked?.has(kanji)) {
      return {
        bgCn: pile.has(kanji)
          ? BOOKMARKED_FILL_CN.reviewing
          : BOOKMARKED_FILL_CN.bookmarked,
        textCn: "text-black",
      };
    }
    // Read per tile, not when the lookup is built: mastery levels depend on
    // the clock, and the lookup lives as long as the pile snapshot.
    const band = getHeatmapBand(metric, pile.get(kanji), Date.now());
    return {
      bgCn: getBandFillCn(measure, band),
      textCn: getBandTextCn(band),
      dimmed: hasNoCardFor(kanji, metric, getAnchor),
    };
  };
  byMetric.set(metric, { getAnchor, bookmarked, lookup });
  return lookup;
};

/** Colors the tiles below by the picked metric instead of by frequency. */
export const MasteryTileColors = ({ children }: { children: ReactNode }) => {
  const [metric] = useHeatmapMetric();
  const [highlightBookmarked] = useHighlightBookmarked();
  const bookmarks = useBookmarkedKanji();
  const { byKanji } = useReviewPileByKanji();
  const getAnchor = useGetAnchorIndexFn();

  return (
    <TileColorContext.Provider
      value={getLookup(
        byKanji,
        metric,
        getAnchor,
        highlightBookmarked ? bookmarks.kanji : null
      )}
    >
      {children}
    </TileColorContext.Provider>
  );
};
