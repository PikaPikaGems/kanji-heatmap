import { createContext } from "react";

export type TileColor = {
  bgCn: string;
  textCn: string;
  /** Hatches the tile, e.g. a /mastery kanji with no card for the metric. */
  dimmed?: boolean;
};

/**
 * Lets a screen decide each tile's fill and text color (the /mastery heatmap)
 * instead of the frequency data source. `null` (no provider) keeps the
 * frequency colors. The lookup must keep its identity between renders unless
 * the colors change, because every visible tile re-renders when it does.
 */
export const TileColorContext = createContext<
  ((kanji: string) => TileColor) | null
>(null);
