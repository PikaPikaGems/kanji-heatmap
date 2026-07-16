import { Virtualizer, WindowVirtualizer } from "virtua";
import React, { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { HoverKanji } from "@/components/sections/KanjiHoverItem";
import { useVirtualListDims } from "./useVirtualDims";

/**
 * In installed PWAs the <body> is the scroll container instead of the window
 * (see the `display-mode: standalone` rules in index.css that work around iOS
 * standalone fixed-position drift), so window-based virtualization would never
 * see any scrolling there. Display mode cannot change within a session, so a
 * one-time check is enough. Must stay in sync with the media query gating the
 * CSS scroller switch.
 */
const isStandaloneDisplay =
  typeof window !== "undefined" &&
  window.matchMedia("(display-mode: standalone)").matches;

/** Virtualizes against the <body> scroller used in standalone display mode. */
const BodyScrollVirtualizer = ({ children }: { children: ReactNode }) => {
  const scrollRef = useRef<HTMLElement | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [startMargin, setStartMargin] = useState(0);

  useLayoutEffect(() => {
    scrollRef.current = document.body;
    const outer = outerRef.current;
    if (!outer) return;
    // Distance from the top of the body's scrollable content to the
    // virtualizer (e.g. the pt-24 clearing the fixed header + control bar).
    setStartMargin(
      Math.max(
        0,
        Math.round(outer.getBoundingClientRect().top + document.body.scrollTop)
      )
    );
  }, []);

  return (
    <div ref={outerRef}>
      <Virtualizer scrollRef={scrollRef} startMargin={startMargin}>
        {children}
      </Virtualizer>
    </div>
  );
};

const ListVirtualizer = ({ children }: { children: ReactNode }) =>
  isStandaloneDisplay ? (
    <BodyScrollVirtualizer>{children}</BodyScrollVirtualizer>
  ) : (
    <WindowVirtualizer>{children}</WindowVirtualizer>
  );

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
      <ListVirtualizer>
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
      </ListVirtualizer>
    </div>
  );
};

export const VirtualKanjiList = React.memo(KanjiListRaw);
