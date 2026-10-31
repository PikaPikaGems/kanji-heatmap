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
import type {
  AnchorWordBasics,
  KanjiAnchorWords,
} from "@/lib/kanji/anchor-words";
import { useGetAnchorWordsFn } from "@/providers/kanji-representative-word-hooks";
import { useReviewPileByKanji } from "@/lib/engine/use-review-pile";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import type { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { useBookmarkedKanji } from "@/lib/engine/use-kanji-sets";
import {
  BOOKMARKED_FILL_CN,
  useHeatmapMetric,
  useHighlightBookmarked,
} from "./use-heatmap-metric";

type TileColorLookup = (kanji: Kanji) => TileColor;

type GetAnchorWords = (
  kanji: string
) => KanjiAnchorWords<AnchorWordBasics> | null;

type CachedLookup = {
  getInfo: GetBasicKanjiInfo | null;
  getAnchorWords: GetAnchorWords | null;
  /** The bookmarks to paint solid, or null when the highlight is off. */
  bookmarked: ReadonlySet<Kanji> | null;
  lookup: TileColorLookup;
};

// The pile map is stable between store updates, so a lookup built for it and
// a metric keeps its identity: tiles only re-render when the pile, the
// metric, the kanji info or the highlighted bookmarks change (no useMemo).
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
  getInfo: GetBasicKanjiInfo | null,
  getAnchorWords: GetAnchorWords | null
): boolean => {
  const info = getInfo?.(kanji);
  if (info != null && info.repWord == null) return true;
  if (getHeatmapCardKind(metric) !== "secondaryReading") return false;
  const anchors = getAnchorWords?.(kanji);
  return anchors != null && anchors.secondary == null;
};

const getLookup = (
  pile: ReadonlyMap<Kanji, ReviewPileItemView>,
  metric: HeatmapMetric,
  getInfo: GetBasicKanjiInfo | null,
  getAnchorWords: GetAnchorWords | null,
  bookmarked: ReadonlySet<Kanji> | null
): TileColorLookup => {
  const byMetric = lookupsByPile.get(pile) ?? new Map();
  lookupsByPile.set(pile, byMetric);
  const cached = byMetric.get(metric);
  if (
    cached &&
    cached.getInfo === getInfo &&
    cached.getAnchorWords === getAnchorWords &&
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
      dimmed: hasNoCardFor(kanji, metric, getInfo, getAnchorWords),
    };
  };
  byMetric.set(metric, { getInfo, getAnchorWords, bookmarked, lookup });
  return lookup;
};

/** Colors the tiles below by the picked metric instead of by frequency. */
export const MasteryTileColors = ({ children }: { children: ReactNode }) => {
  const [metric] = useHeatmapMetric();
  const [highlightBookmarked] = useHighlightBookmarked();
  const bookmarks = useBookmarkedKanji();
  const { byKanji } = useReviewPileByKanji();
  const getInfo = useGetKanjiInfoFn();
  // The secondary words are only needed to dim kanji without one.
  const getAnchorWords = useGetAnchorWordsFn(
    getHeatmapCardKind(metric) === "secondaryReading"
  );

  return (
    <TileColorContext.Provider
      value={getLookup(
        byKanji,
        metric,
        getInfo,
        getAnchorWords,
        highlightBookmarked ? bookmarks.kanji : null
      )}
    >
      {children}
    </TileColorContext.Provider>
  );
};
