import { WindowVirtualizer } from "virtua";
import React, { useCallback, useState } from "react";
import { useKanjiUrlState } from "@/components/dependent/routing/routing-hooks";
import { HoverKanji } from "@/components/sections/KanjiHoverItem";
import { useVirtualListDims } from "./useVirtualDims";
import { KanjiDrawer } from "../Drawer";

const KanjiListRaw = ({
  kanjiKeys = [],
  size,
}: {
  kanjiKeys?: string[];
  size: "compact" | "expanded";
}) => {
  const [hoveredKanji, setHoveredKanji] = useState<string | null>(null);

  const [openedKanji, setOpenedKanji] = useKanjiUrlState();

  const onDrawerClose = useCallback(() => {
    setOpenedKanji(null);
  }, [setOpenedKanji]);

  const { cols, rows } = useVirtualListDims(kanjiKeys.length, size);

  return (
    <>
      <WindowVirtualizer>
        {Array.from({ length: rows }).map((_, rowIndex) => {
          const isNotLast = rowIndex < rows - 1;
          const hasCompleteRows = isNotLast || kanjiKeys.length % cols === 0;
          const items = hasCompleteRows ? cols : kanjiKeys.length % cols;
          return (
            <div
              key={rowIndex}
              className={`flex items-center justify-center w-full pr-1 ${isNotLast ? "pb-1" : "pb-16"}`}
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
                    openDrawer={setOpenedKanji}
                  />
                );
              })}
            </div>
          );
        })}
      </WindowVirtualizer>

      <KanjiDrawer
        isOpen={openedKanji !== null}
        onClose={onDrawerClose}
        kanji={openedKanji ?? ""}
      />
    </>
  );
};

export const VirtualKanjiList = React.memo(KanjiListRaw);
