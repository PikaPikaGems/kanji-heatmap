import { useState } from "react";

/**
 * State for a `HintChip` flashed after an action ("You're offline", "Copied
 * to clipboard"): `show` sets the text and bumps the key so the chip's
 * animation restarts on repeat taps; `done` (the chip's animation end)
 * hides it.
 */
export const useFlashHint = () => {
  const [hint, setHint] = useState<{ text: string; key: number } | null>(null);
  return {
    hint,
    show: (text: string) =>
      setHint((prev) => ({ text, key: (prev?.key ?? 0) + 1 })),
    done: () => setHint(null),
  };
};
