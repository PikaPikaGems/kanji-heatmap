import React, { useCallback, useRef, useState } from "react";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import {
  useKanjiSearchResult,
  useSphmnDrawer,
} from "@/kanji-worker/kanji-worker-hooks";
import { RadicalBtn } from "../RadicalScreen/RadicalScreen";

/**
 * Bands under trial (user, October 2026): the drawer is shown either as one
 * list or split by match count. Each band is the lowest count it holds.
 */
const BANDS: { min: number; label: string }[] = [
  { min: 50, label: "In 50+ kanji" },
  { min: 20, label: "In 20–49 kanji" },
  { min: 5, label: "In 5–19 kanji" },
  { min: 2, label: "In 2–4 kanji" },
  { min: 1, label: "In 1 kanji" },
];
const bandOf = (matches: number) =>
  BANDS.find((band) => matches >= band.min) ?? BANDS[BANDS.length - 1];

const BandHeading = ({ label }: { label: string }) => (
  <div className="w-full px-1 pt-2 pb-1 text-xs font-bold text-left text-foreground/60">
    {label}
  </div>
);

/**
 * Temporary, dev server only: flips between the plain list and the bands so
 * the two can be compared. Remove once one is chosen.
 */
const BandsToggle = ({
  showBands,
  onToggle,
}: {
  showBands: boolean;
  onToggle: () => void;
}) => (
  <div className="w-full px-1 pb-1 text-xs text-left">
    <button className="underline" onClick={onToggle}>
      {showBands ? "Bands: on (dev)" : "Bands: off (dev)"}
    </button>
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

  if (drawer == null) {
    return null;
  }

  return (
    <>
      {import.meta.env.DEV && (
        <BandsToggle
          showBands={showBands}
          onToggle={() => setShowBands((on) => !on)}
        />
      )}
      {drawer.map(([component, matches], index) => {
        const isSelected = value.has(component);
        const isDisabled =
          possibleComponents != null &&
          !isSelected &&
          !possibleComponents.has(component);
        const band = bandOf(matches);
        const startsBand =
          showBands && (index === 0 || bandOf(drawer[index - 1][1]) !== band);
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
    </>
  );
};
