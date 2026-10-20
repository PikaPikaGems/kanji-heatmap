import { useShowBookmarkFilterToggle } from "@/lib/engine/use-bookmark-filter-toggle";
import { ToggleRow } from "./ToggleRow";

/** Hidden in builds without the study engine; bookmarks live in the account. */
export const BookmarkedOnlyToggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  const show = useShowBookmarkFilterToggle();
  if (!show) return null;

  return (
    <ToggleRow
      id="bookmarked-only"
      label="Bookmarked only"
      checked={checked}
      onChange={onChange}
    />
  );
};
