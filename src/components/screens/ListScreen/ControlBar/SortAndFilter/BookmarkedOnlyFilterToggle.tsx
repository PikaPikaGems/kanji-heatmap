import { useBookmarkFilterToggle } from "@/lib/engine/use-bookmark-filter-toggle";
import { FilterToggleRow } from "./FilterToggleRow";

/** Hidden in builds without the study engine; bookmarks live in the account. */
export const BookmarkedOnlyFilterToggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  const toggle = useBookmarkFilterToggle(checked);
  if (toggle == null) return null;

  return (
    <FilterToggleRow
      id="filter-bookmarked-only"
      label="Bookmarked only"
      checked={checked}
      onChange={onChange}
      disabled={toggle.disabled}
      hint={toggle.hint}
    />
  );
};
