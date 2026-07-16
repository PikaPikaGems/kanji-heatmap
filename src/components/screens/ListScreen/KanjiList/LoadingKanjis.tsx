import {
  randomCn,
  randomCn2,
  randomCnColorful,
  randomCn2Colorful,
  randomCnGradientAlt,
  randomCn2GradientAlt,
} from "@/lib/cn-fns";
import { useVirtualListDims } from "./useVirtualDims";
import React, { useMemo } from "react";
import { useDeferredItemSettings } from "@/providers/item-settings-hooks";

const ESTIMATE_ITEM_COUNT = 125;

const getLoadingTileCn = (
  type: "colorful" | "gradient" | "gradient-alt",
  isCompact: boolean
) => {
  if (type === "colorful") {
    return isCompact ? randomCn2Colorful() : randomCnColorful();
  }
  if (type === "gradient") {
    return isCompact ? randomCn2() : randomCn();
  }
  return isCompact ? randomCn2GradientAlt() : randomCnGradientAlt();
};

const LoadingKanjisRaw = ({
  type = "gradient-alt",
}: {
  type?: "colorful" | "gradient" | "gradient-alt";
}) => {
  const itemSettings = useDeferredItemSettings();
  const isCompact = itemSettings.cardType === "compact";
  const { itemSize, width, cols, idealRows, itemNums } = useVirtualListDims(
    ESTIMATE_ITEM_COUNT,
    itemSettings.cardType
  );

  // Match the real grid size — idealRows is viewport-based and often >> 125.
  const tileCount = Math.max(itemNums, 1);
  const tileCns = useMemo(
    () =>
      Array.from({ length: tileCount }, () =>
        getLoadingTileCn(type, isCompact)
      ),
    [tileCount, type, isCompact]
  );

  const itemStyle = isCompact
    ? { minHeight: itemSize - 6, minWidth: width - 6 }
    : { minHeight: itemSize, minWidth: width };

  return (
    <div role="status" className="flex flex-wrap items-start justify-start">
      <div className="sr-only">loading</div>
      {new Array(idealRows).fill(null).map((_, rowIndex) => {
        return (
          <div
            className={`flex items-center justify-center w-full px-1 ${rowIndex === 0 ? "pt-6" : ""}`}
            key={`row-${rowIndex}`}
          >
            {new Array(cols).fill(null).map((_, colIndex) => {
              const index = rowIndex * cols + colIndex;
              const colorCn = tileCns[index] ?? tileCns[0];
              return (
                <div
                  key={colIndex}
                  style={{
                    ...itemStyle,
                    // Stagger so every tile clearly pulses (not just the first wave).
                    animationDelay: `${(index % 16) * 0.12}s`,
                  }}
                  className={`animate-pulse [animation-duration:2.4s] mr-1 mb-1 grow ${colorCn}`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const LoadingKanjis = React.memo(LoadingKanjisRaw);

export default LoadingKanjis;
