/**
 * Ephemeral "Switched to <type>" chip shown when a paste or IME commit
 * auto-changes the search type. Keyed so the CSS animation restarts on
 * rapid consecutive switches; hides itself when the animation ends.
 */
export const SearchTypeHint = ({
  hint,
  hintKey,
  onDone,
}: {
  hint: string | null;
  hintKey: number;
  onDone: () => void;
}) => {
  if (hint == null) {
    return null;
  }

  return (
    // Bottom-left so it sits over the item-count badge area; motion makes the switch hard to miss.
    <span
      key={hintKey}
      className="pointer-events-none absolute left-0 z-20 px-2 py-0.5 text-xs font-semibold border rounded-md shadow-sm -bottom-7 border-cyan-500 bg-background dark:text-cyan-300 text-cyan-600 animate-search-type-hint"
      role="status"
      aria-live="polite"
      onAnimationEnd={onDone}
    >
      Switched to {hint}
    </span>
  );
};
