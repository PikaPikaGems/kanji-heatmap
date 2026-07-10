import { useState, useEffect } from "react";
import { countCompletedSets } from "./storage";
import { SPEED_KATAKANA_TOTAL_CHALLENGES } from "./constants";

export const useCompletedSetsCount = () => {
  const [count, setCount] = useState(() =>
    countCompletedSets(SPEED_KATAKANA_TOTAL_CHALLENGES)
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("speed-katakana-stats-")) {
        setCount(countCompletedSets(SPEED_KATAKANA_TOTAL_CHALLENGES));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return count;
};
