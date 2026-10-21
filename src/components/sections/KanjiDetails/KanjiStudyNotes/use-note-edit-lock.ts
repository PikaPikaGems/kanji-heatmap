import { useEffect, useState } from "react";

/**
 * - `idle`: not editing, nothing requested.
 * - `pending`: asked, no answer yet.
 * - `held`: this tab is the one editor for the kanji.
 * - `unavailable`: another tab already has the editor open.
 */
export type NoteEditLock = "idle" | "pending" | "held" | "unavailable";

/**
 * One editor per kanji across tabs (host/guide/NOTES.md): the engine doesn't
 * stop two tabs from saving over each other, so editing needs a Web Lock named
 * after the kanji. Taken while `wanted` is true and dropped when it turns
 * false or the component unmounts (closing the tab drops it too).
 */
export const useNoteEditLock = (
  kanji: string,
  wanted: boolean
): NoteEditLock => {
  const [state, setState] = useState<"pending" | "held" | "unavailable">(
    "pending"
  );

  // Effect needed: a Web Lock is held until the promise returned from its
  // callback settles, so it is a resource that must be released when editing
  // stops or the component unmounts. No render-time derivation or event
  // handler can see an unmount.
  useEffect(() => {
    if (!wanted) return;
    const hold: { cancelled: boolean; release?: () => void } = {
      cancelled: false,
    };
    // A microtask later, so StrictMode's immediate mount / unmount / mount in
    // dev cancels the first request before it is made. Otherwise that request
    // would still hold the lock when the second asks, and the second would
    // wrongly report "open in another tab".
    queueMicrotask(() => {
      if (hold.cancelled) return;
      void navigator.locks.request(
        `kh-note-edit:${kanji}`,
        { ifAvailable: true },
        (lock) => {
          if (hold.cancelled) return;
          if (lock === null) {
            setState("unavailable");
            return;
          }
          setState("held");
          return new Promise<void>((resolve) => {
            hold.release = resolve;
          });
        }
      );
    });
    return () => {
      hold.cancelled = true;
      hold.release?.();
      setState("pending");
    };
  }, [kanji, wanted]);

  return wanted ? state : "idle";
};
