import { useState } from "react";

/**
 * How long after something appears its buttons ignore taps. On touch screens
 * a quick second tap on the previous screen's button (the answer drawer's
 * Continue, say) lands on whatever is under it next, e.g. "I'm done" or
 * "Forgot", and would act on it by accident.
 */
const TAP_GUARD_MS = 500;

/**
 * Wraps click handlers so they do nothing for the first 0.5 s after the
 * calling component mounts; remount it (a `key`) to start the guard again.
 * Keyboard shortcuts with their own handlers are not affected.
 */
export const useTapGuard = () => {
  const [shownAt] = useState(() => Date.now());
  return (action: () => void) => () => {
    if (Date.now() - shownAt < TAP_GUARD_MS) return;
    action();
  };
};
