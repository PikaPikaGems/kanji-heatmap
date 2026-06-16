import { useState, useEffect } from "react";

export function useCrossfade(value: string) {
  const [displayed, setDisplayed] = useState(value);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (value === displayed) return;
    setOpacity(0);
    const t = setTimeout(() => {
      setDisplayed(value);
      setOpacity(1);
    }, 180);
    return () => clearTimeout(t);
    // displayed is intentionally excluded: including it would re-run on setDisplayed, looping
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { displayed, opacity };
}
