import { useWindowSize } from "@/hooks/use-window-size";

export const TILE_SIZE = {
  sm: {
    width: 50,
    height: 55,
  },
  lg: {
    width: 132,
    height: 135,
  },
};

export const useVirtualListDims = (
  itemCount: number,
  size: "compact" | "expanded"
) => {
  const [windowWidth, windowHeight] = useWindowSize();
  const tileSize = size === "compact" ? TILE_SIZE.sm : TILE_SIZE.lg;

  // At least 1: a 0 width (e.g. a hidden window) would make rows Infinity.
  const cols = Math.max(1, Math.floor(windowWidth / tileSize.width));
  const rows = Math.ceil(itemCount / cols);
  const idealRows = Math.ceil(windowHeight / tileSize.height);
  const itemNums = cols * idealRows;

  return {
    cols,
    rows,
    itemSize: tileSize.height,
    width: tileSize.width,
    itemNums,
    idealRows,
  };
};
