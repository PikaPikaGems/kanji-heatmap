import React, { ReactNode, useCallback, useRef } from "react";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import {
  useGetKanjiInfoFn,
  useKanjiSearchResult,
} from "@/kanji-worker/kanji-worker-hooks";
import { KANJI_COUNT } from "@/lib/options/constants";
import {
  moreRadicalKeywords,
  radicalsGroupedByStrokeCount,
} from "@/lib/radicals";
import { CircleX } from "@/components/icons";
import { KanjiItemSimpleButton } from "@/components/sections/KanjiHoverItem/KanjiItemButton";
import { ClearFiltersCTA } from "@/components/dependent/routing/ClearFiltersCTA";
import { externalLinks } from "@/lib/external-links";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { SmallUnexpectedErrorFallback } from "@/components/error/SmallUnexpectedErrorFallback";

/**
 * How many matches the results strip renders. Enough to fill several screens of
 * horizontal scrolling; past that it is cost with no benefit.
 */
const RESULTS_PREVIEW_LIMIT = 120;

const StrokeDivider = ({ stroke }: { stroke: string }) => {
  return (
    <div
      className={`
        w-[47px] h-[45px]
        ml-1 mb-1 kanji-font text-xl rounded-md
        flex justify-center items-center
        text-theme-color-with-opacity-100
        border-theme-color-with-opacity-40
        border
      `}
    >
      {stroke}
    </div>
  );
};

/**
 * 253 of these render at once, so it is memoised and every prop is a primitive
 * or a stable callback. `onToggle` takes the radical rather than closing over
 * it, which is what lets one shared handler serve the whole grid — a per-button
 * arrow function would make the memo useless.
 */
const RadicalBtn = React.memo(function RadicalBtn({
  isDisabled,
  onToggle,
  isTouchDevice,
  isSelected,
  radical,
}: {
  isDisabled: boolean;
  onToggle: (
    radical: string,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  isSelected: boolean;
  radical: string;
  isTouchDevice: boolean;
}) {
  const cn1 = isDisabled
    ? "opacity-10"
    : isTouchDevice
      ? ""
      : "hover:bg-[#2effff] hover:text-black hover:border-4 hover:border-solid hover:border-[#2effff] rounded-sm";

  const cn2 = isSelected
    ? "rounded-xl bg-black text-white dark:bg-white dark:text-black"
    : "border border-dotted border-current rounded-sm";
  return (
    <button
      disabled={isDisabled}
      onClick={(e) => onToggle(radical, e)}
      className={`
        w-[47px] h-[45px] transition-all duration-500 ml-1 mb-1 kanji-font text-2xl
        disabled:cursor-not-allowed disabled:border-dotted
        ${cn1}
        ${cn2}
      `}
    >
      {radical}
    </button>
  );
});

const ExpandedRadicalBtn = ({
  onClick,
  radical,
  radicalKeyword,
}: {
  radical: string;
  radicalKeyword: string;
  onClick: () => void;
}) => {
  return (
    <div
      className={`
        relative
        grow min-w-[85px] h-full ml-1 -mt-1 mb-0 py-0
        flex flex-col justify-center items-center shrink-0 
        rounded-xl  
        bg-black text-white dark:bg-white dark:text-black
            `}
    >
      <button onClick={onClick}>
        <CircleX className="absolute scale-75 top-1 right-1 hover:text-red-500" />
        <span className="sr-only">Close</span>
      </button>
      <span className="block mb-1 text-4xl kanji-font">{radical}</span>
      <span
        className="
          block !text-ellipsis !text-nowrap mx-4 !overflow-hidden !whitespace-nowrap 
          text-xs font-bold px-2 rounded-full
          bg-foreground text-background"
      >
        {radicalKeyword}
      </span>
    </div>
  );
};

const TitleLayout = ({ children }: { children: ReactNode }) => {
  return (
    <span className="px-1 text-sm font-bold rounded-full text-foreground bg-background">
      {children}
    </span>
  );
};

export const ResultPreviewTitle = () => {
  const { data } = useKanjiSearchResult();
  const count = (data ?? []).length;

  return (
    <TitleLayout> Results Preview {count > 0 ? `(${count})` : ""}</TitleLayout>
  );
};

export const SelectRadicalTitle = ({ count }: { count: number }) => {
  if (count <= 0) {
    return <TitleLayout>Select Radicals</TitleLayout>;
  }
  return <TitleLayout>Radicals Selected {`(${count})`}</TitleLayout>;
};

export const RadicalScreenLayout = ({
  top,
  middle,
  bottom,
  count,
}: {
  top: ReactNode;
  middle: ReactNode;
  bottom: ReactNode;
  count: number;
}) => {
  if (count === 0) {
    return (
      <div className="relative w-full px-1 mx-auto">
        <div className="absolute z-50 w-full m-auto -top-1">
          <SelectRadicalTitle count={count} />
        </div>
        <div
          className="relative flex flex-wrap items-start justify-center w-full px-2 py-3 mt-2 overflow-y-auto border-2 border-dotted rounded-md border-foreground/40"
          style={{ maxHeight: "calc(100dvh - 30px)" }}
        >
          {top}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full px-1 mx-auto">
      <div className="absolute z-50 w-full m-auto -top-1">
        <SelectRadicalTitle count={count} />
      </div>

      <div
        className="relative flex flex-wrap items-start justify-center w-full px-2 py-3 mt-2 overflow-y-auto border-2 border-dotted rounded-md border-foreground/40"
        style={{ maxHeight: "calc(100dvh - 314px)" }}
      >
        {top}
      </div>
      <div className="relative flex w-full h-24 pt-1 pb-0 mt-1 mb-1 overflow-x-auto overflow-y-hidden transition-all rounded-md scrollbar-thin animate-fade-in">
        {middle}
      </div>

      <div className="z-50 flex w-full pt-4 pb-2 mt-2 mb-2 overflow-x-auto overflow-y-hidden border-2 border-dotted rounded-md h-44 border-foreground/40 scrollbar-thin animate-fade-in">
        {bottom}
      </div>
      <div className="absolute bottom-[170px] w-full m-auto z-50">
        <ResultPreviewTitle />
      </div>
    </div>
  );
};

export const RadicalScreenContent = ({
  value,
  setValue,
}: {
  value: Set<string>;
  setValue: (_: Set<string>) => void;
}) => {
  const { additionalData: possibleRadicals } = useKanjiSearchResult();
  const isTouchDevice = useIsTouchDevice();

  const getBasicInfo = useGetKanjiInfoFn();

  // The handler must keep one identity across renders or RadicalBtn's memo
  // never hits, but it needs the current selection. A ref gives it both:
  // the callback stays stable while always reading the latest values.
  const latest = useRef({ value, setValue });
  latest.current = { value, setValue };

  const handleToggle = useCallback(
    (
      radical: string,
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
      const { value: selected, setValue: commit } = latest.current;
      const next = new Set(selected);

      if (next.delete(radical)) {
        // Deselecting leaves focus on a button that is about to look
        // unselected; blurring keeps the hover styling from sticking.
        e.currentTarget.blur();
      } else {
        next.add(radical);
      }

      commit(next);
    },
    []
  );

  if (getBasicInfo == null) {
    return null;
  }

  return (
    <>
      {Object.keys(radicalsGroupedByStrokeCount).map((stroke) => {
        const keyValue = stroke as keyof typeof radicalsGroupedByStrokeCount;
        return (
          <React.Fragment key={stroke}>
            {radicalsGroupedByStrokeCount[keyValue].map((radical, index) => {
              const isSelected = value.has(radical);
              const isDisabled =
                possibleRadicals == null
                  ? false
                  : (possibleRadicals as Set<string>).has(radical) || isSelected
                    ? false
                    : true;

              return (
                <React.Fragment key={radical}>
                  {index === 0 && <StrokeDivider stroke={stroke} />}
                  <RadicalBtn
                    isDisabled={isDisabled}
                    onToggle={handleToggle}
                    radical={radical}
                    isSelected={isSelected}
                    isTouchDevice={isTouchDevice}
                  />
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const RadicalsSelected = ({
  value,
  onClick,
}: {
  value: string[];
  onClick: (radical: string) => void;
}) => {
  const getBasicInfo = useGetKanjiInfoFn();

  if (getBasicInfo == null) {
    return null;
  }

  return (
    <>
      {value.map((radical) => {
        const radicalKeyword =
          getBasicInfo(radical)?.keyword ??
          moreRadicalKeywords[radical] ??
          "...";

        return (
          <ExpandedRadicalBtn
            key={radical}
            radical={radical}
            radicalKeyword={radicalKeyword}
            onClick={() => {
              onClick(radical);
            }}
          />
        );
      })}
    </>
  );
};

export const RadicalsResultsPreview = ({
  onClick,
}: {
  onClick: () => void;
}) => {
  const { data, status } = useKanjiSearchResult();

  if (status === "loading" || data == null) {
    return (
      <div className="flex items-center justify-center w-full h-full p-2 text-xs font-bold">
        <div>{`読み込み中 · Loading...`}</div>
      </div>
    );
  }

  if (status === "error") {
    return <SmallUnexpectedErrorFallback />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full p-2 text-xs font-bold">
        <div>
          {"すみません 🙇🏽‍♀️ 🙇 . No match found."}
          <ClearFiltersCTA
            defaultMsg={
              <div className="flex flex-wrap items-center justify-center space-x-1">
                Try:
                {externalLinks.slice(0, 5).map((item, index) => {
                  return (
                    <span className="my-1 block-inline" key={item.name}>
                      <ExternalTextLink
                        href={item.url("捜")}
                        text={item.name}
                      />
                      {index == 3 ? "or" : index === 4 ? "" : ","}
                    </span>
                  );
                })}
              </div>
            }
          />
        </div>
      </div>
    );
  }

  if (data.length === KANJI_COUNT) {
    return null;
  }

  // Each item runs useItemBtnCn and renders ExpandedBtnContent, so this strip
  // is the expensive part of the drawer, not the search. Selecting a common
  // radical can match well over a thousand kanji, and rendering them all is
  // what makes the drawer freeze — in a 176px-tall horizontal strip nobody
  // scrolls that far anyway. Cap it and say how many are hidden; the full set
  // is one tap away by closing the drawer.
  const shown = data.slice(0, RESULTS_PREVIEW_LIMIT);
  const hidden = data.length - shown.length;

  return (
    <>
      {shown.map((kanji) => (
        <KanjiItemSimpleButton key={kanji} kanji={kanji} onClick={onClick} />
      ))}
      {hidden > 0 && (
        <button
          onClick={onClick}
          className="flex flex-col items-center justify-center h-full px-3 text-xs font-bold shrink-0 text-foreground/70 hover:text-foreground"
        >
          <span className="text-lg">+{hidden}</span>
          <span>more</span>
        </button>
      )}
    </>
  );
};
