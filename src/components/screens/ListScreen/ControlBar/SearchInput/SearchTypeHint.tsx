import { HintChip } from "@/components/common/HintChip";

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
    <HintChip key={hintKey} className="left-0 -bottom-7" onDone={onDone}>
      Switched to {hint}
    </HintChip>
  );
};
