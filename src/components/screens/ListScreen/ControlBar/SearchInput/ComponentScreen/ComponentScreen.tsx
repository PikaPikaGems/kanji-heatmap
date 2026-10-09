import React, { useCallback, useRef } from "react";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import {
  useKanjiSearchResult,
  useSphmnDrawer,
} from "@/kanji-worker/kanji-worker-hooks";
import { RadicalBtn } from "../RadicalScreen/RadicalScreen";

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
      {drawer.map(([component]) => {
        const isSelected = value.has(component);
        const isDisabled =
          possibleComponents != null &&
          !isSelected &&
          !possibleComponents.has(component);
        return (
          <RadicalBtn
            key={component}
            isDisabled={isDisabled}
            onToggle={handleToggle}
            radical={component}
            isSelected={isSelected}
            isTouchDevice={isTouchDevice}
          />
        );
      })}
    </>
  );
};
