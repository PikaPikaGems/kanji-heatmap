import React, { useCallback, useMemo, useRef, useState } from "react";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import {
  useKanjiSearchResult,
  useSphmnDrawer,
} from "@/kanji-worker/kanji-worker-hooks";
import { Switch } from "@/components/ui/switch";
import { RadicalBtn } from "../RadicalScreen/RadicalScreen";

/**
 * The drawer is shown split into bands by match count (the default) or as
 * one list; a switch at the top flips between them. Each band is the lowest
 * count it holds.
 */
const BANDS: { min: number; label: string }[] = [
  { min: 50, label: "In 50+ kanji" },
  { min: 20, label: "In 20–49 kanji" },
  { min: 10, label: "In 10–19 kanji" },
  { min: 6, label: "In 6–9 kanji" },
  { min: 4, label: "In 4–5 kanji" },
  { min: 3, label: "In 3 kanji" },
  { min: 2, label: "In 2 kanji" },
  { min: 1, label: "In 1 kanji" },
];
const bandOf = (matches: number) =>
  BANDS.find((band) => matches >= band.min) ?? BANDS[BANDS.length - 1];

type DrawerEntry = [component: string, matches: number, strokes: number | null];

/**
 * Inside a band, fewest strokes first (unknown last), then most matches.
 * The drawer comes most-matches first, so bands are already in order and a
 * stable sort keeps the rest of that order.
 */
const sortInBands = (drawer: DrawerEntry[]) =>
  [...drawer].sort(
    ([, matchesA, strokesA], [, matchesB, strokesB]) =>
      BANDS.indexOf(bandOf(matchesA)) - BANDS.indexOf(bandOf(matchesB)) ||
      (strokesA ?? Infinity) - (strokesB ?? Infinity) ||
      matchesB - matchesA
  );

const BandHeading = ({ label }: { label: string }) => (
  <div className="w-full px-1 pt-2 pb-1 text-xs font-bold text-left text-foreground/60">
    {label}
  </div>
);

const BandsSwitch = ({
  showBands,
  onChange,
}: {
  showBands: boolean;
  onChange: (showBands: boolean) => void;
}) => (
  <div className="flex items-center w-full gap-2 px-1 pb-1">
    <Switch
      id="component-bands"
      checked={showBands}
      onCheckedChange={onChange}
    />
    <label
      htmlFor="component-bands"
      className="text-xs font-bold cursor-pointer select-none"
    >
      Group by how many kanji
    </label>
  </div>
);

/**
 * The component drawer: sph-mn's components, most matches first. Each button
 * is the memoised RadicalBtn with one shared toggle handler, so a tap
 * re-renders only the buttons whose state changed, not all 979.
 */
export const ComponentScreenContent = ({
  value,
  setValue,
}: {
  value: Set<string>;
  setValue: (_: Set<string>) => void;
}) => {
  const { additionalData: possibleComponents } = useKanjiSearchResult();
  const isTouchDevice = useIsTouchDevice();
  const { data: drawer } = useSphmnDrawer();
  const [showBands, setShowBands] = useState(true);
  const ordered = useMemo(
    () => (drawer == null ? null : showBands ? sortInBands(drawer) : drawer),
    [drawer, showBands]
  );

  // Same pattern as RadicalScreenContent: a stable handler reading the
  // latest selection through a ref keeps RadicalBtn's memo working.
  const latest = useRef({ value, setValue });
  latest.current = { value, setValue };

  const handleToggle = useCallback(
    (
      component: string,
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
      const { value: selected, setValue: commit } = latest.current;
      const next = new Set(selected);
      if (next.delete(component)) {
        e.currentTarget.blur();
      } else {
        next.add(component);
      }
      commit(next);
    },
    []
  );

  if (ordered == null) {
    return null;
  }

  return (
    <>
      <BandsSwitch showBands={showBands} onChange={setShowBands} />
      {/* Keyed by mode so the buttons fade in again after each flip. */}
      <div
        key={showBands ? "bands" : "list"}
        className="flex flex-wrap items-start justify-center w-full animate-fade-in"
      >
        {ordered.map(([component, matches], index) => {
          const isSelected = value.has(component);
          const isDisabled =
            possibleComponents != null &&
            !isSelected &&
            !possibleComponents.has(component);
          const band = bandOf(matches);
          const startsBand =
            showBands &&
            (index === 0 || bandOf(ordered[index - 1][1]) !== band);
          return (
            <React.Fragment key={component}>
              {startsBand && <BandHeading label={band.label} />}
              <RadicalBtn
                isDisabled={isDisabled}
                onToggle={handleToggle}
                radical={component}
                isSelected={isSelected}
                isTouchDevice={isTouchDevice}
              />
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};
