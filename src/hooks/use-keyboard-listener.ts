import { useEffect, useRef, useCallback } from "react";

type KeyHandler = (event: KeyboardEvent) => void;
type KeyEventMap = {
  [key: string]: KeyHandler;
};

interface KeyboardListenerOptions {
  target?: EventTarget;
  eventType?: "keydown" | "keyup" | "keypress";
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * A React hook for handling keyboard events.
 *
 * @param keyEventMap - An object mapping key names to handler functions
 * @param options - Additional options for the keyboard listener
 * @returns void
 *
 * @example
 * useKeyboardListener({
 *   'Escape': () => setModalOpen(false),
 *   'Enter': handleSubmit,
 *   'ArrowUp': () => setSelectedIndex(prev => Math.max(0, prev - 1)),
 *   'ArrowDown': () => setSelectedIndex(prev => Math.min(items.length - 1, prev + 1)),
 * });
 */
function useKeyboardListener(
  keyEventMap: KeyEventMap,
  options: KeyboardListenerOptions = {}
): void {
  // Default options
  const {
    target = window,
    eventType = "keydown",
    preventDefault = false,
    stopPropagation = false,
  } = options;

  // Use a ref to avoid recreating the event handler on every render
  const keyMapRef = useRef<KeyEventMap>(keyEventMap);

  // Update the ref when keyEventMap changes
  useEffect(() => {
    keyMapRef.current = keyEventMap;
  }, [keyEventMap]);

  // Event handler
  const handleKeyEvent = useCallback(
    (event: KeyboardEvent) => {
      const handler = keyMapRef.current[event.key];

      if (handler) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();

        handler(event);
      }
    },
    [preventDefault, stopPropagation]
  );

  // Set up and clean up the event listener
  useEffect(() => {
    const currentTarget = target;

    currentTarget.addEventListener(eventType, handleKeyEvent as EventListener);

    return () => {
      currentTarget.removeEventListener(
        eventType,
        handleKeyEvent as EventListener
      );
    };
  }, [target, eventType, handleKeyEvent]);
}

export default useKeyboardListener;
