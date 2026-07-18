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

  // Ref keeps the listener stable while always reading the latest handlers;
  // assigned during render (no effect needed for a plain ref sync).
  const keyMapRef = useRef<KeyEventMap>(keyEventMap);
  keyMapRef.current = keyEventMap;

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

  // Effect needed: subscribes to an external event target (window/element)
  // and must remove the listener on unmount/option change.
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
