import { useRef } from "react";

/**
 * Composition-aware input handlers shared by the kana/romaji typing practice
 * modes. IMEs (e.g. the iOS Japanese keyboard) fire change events mid- and
 * post-composition inconsistently; transforming the value during composition
 * makes iOS Safari duplicate the committed character. These handlers keep the
 * raw value while composing (via `setRawValue`) and only run the real
 * conversion once per commit (via `onCommit`), swallowing the redundant
 * trailing change desktop browsers fire.
 *
 * Spread the returned object onto the <input>:
 *   <Input {...useKanaInput({ setRawValue: setValue, onCommit: handleChange })} />
 */
export const useKanaInput = ({
  setRawValue,
  onCommit,
}: {
  setRawValue: (raw: string) => void;
  onCommit: (raw: string) => void;
}) => {
  const isComposingRef = useRef(false);
  const suppressNextChangeRef = useRef(false);

  return {
    onCompositionStart: () => {
      isComposingRef.current = true;
      // A new composition means any pending suppression is stale.
      suppressNextChangeRef.current = false;
    },
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      // iOS commits kana and fires no trailing change event, so the conversion
      // must run here. Desktop *does* fire a trailing change, so suppress that
      // one duplicate (cleared on a macrotask, after it has fired).
      suppressNextChangeRef.current = true;
      setTimeout(() => {
        suppressNextChangeRef.current = false;
      }, 0);
      onCommit(e.currentTarget.value);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // nativeEvent is typed as Event; isComposing lives on InputEvent.
      const composing =
        "isComposing" in e.nativeEvent &&
        (e.nativeEvent as InputEvent).isComposing;
      if (isComposingRef.current || composing) {
        setRawValue(raw);
        return;
      }
      // Swallow the redundant change desktop fires right after commit.
      if (suppressNextChangeRef.current) {
        suppressNextChangeRef.current = false;
        return;
      }
      onCommit(raw);
    },
  };
};
