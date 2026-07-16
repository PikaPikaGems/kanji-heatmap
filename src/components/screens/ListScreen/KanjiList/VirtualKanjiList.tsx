import { WindowVirtualizer } from "virtua";
import React, { useState } from "react";
import { HoverKanji } from "@/components/sections/KanjiHoverItem";
import { useVirtualListDims } from "./useVirtualDims";

const KanjiListRaw = ({
  kanjiKeys = [],
  size,
}: {
  kanjiKeys?: string[];
  size: "compact" | "expanded";
}) => {
  const [hoveredKanji, setHoveredKanji] = useState<string | null>(null);
  const { cols, rows } = useVirtualListDims(kanjiKeys.length, size);

  return (
    <div className="w-full animate-fade-in">
      <WindowVirtualizer>
        {Array.from({ length: rows }).map((_, rowIndex) => {
          const isNotLast = rowIndex < rows - 1;
          const hasCompleteRows = isNotLast || kanjiKeys.length % cols === 0;
          const items = hasCompleteRows ? cols : kanjiKeys.length % cols;
          return (
            <div
              key={rowIndex}
              className={`flex items-center justify-center w-full pr-1 ${rowIndex === 0 ? "pt-6 pb-1" : isNotLast ? "pb-1" : "pb-28"}`}
            >
              {new Array(items).fill(null).map((_, colIndex: number) => {
                const index = cols * rowIndex + colIndex;
                const key = kanjiKeys[index];
                return (
                  <HoverKanji
                    key={key}
                    trigger={key}
                    isOpen={hoveredKanji === key}
                    setOpen={setHoveredKanji}
                  />
                );
              })}
            </div>
          );
        })}
      </WindowVirtualizer>
    </div>
  );
};

export const VirtualKanjiList = React.memo(KanjiListRaw);
