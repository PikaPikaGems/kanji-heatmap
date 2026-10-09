import { BOOKMARK_KEY_PREFIX } from "@/lib/bookmarks";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { isKanji } from "@/lib/utils";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { useStorageValue } from "@/hooks/use-storage-value";
import { KANJI_COUNT } from "@/lib/options/constants";
import { getFinalResults } from "@/lib/results-utils";

const countBookmarked = () => {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key?.startsWith(BOOKMARK_KEY_PREFIX) &&
      localStorage.getItem(key) === "true"
    )
      n++;
  }
  return n;
};

const useKnownCount = () =>
  useStorageValue(
    countBookmarked,
    (key) => key?.startsWith(BOOKMARK_KEY_PREFIX) ?? false
  );

const KnownBadge = () => {
  const knownCount = useKnownCount();

  return (
    <>
      {knownCount > 0 && (
        <div className="px-2 text-xs font-extrabold text-green-500 bg-opacity-75 border rounded-lg border-green-500/50 bg-background">
          ✓ {knownCount} Bookmarked
        </div>
      )}
    </>
  );
};

const ItemsCountLayout = ({
  count,
  hiddenByFilters = false,
}: {
  count: number | null;
  /** Filters hid some matches: a dot in the chip says so. */
  hiddenByFilters?: boolean;
}) => {
  return (
    // Always absolute so this never joins the ControlBar flex row and
    // squeezes the sort/presentation icon buttons out of view.
    <div className="absolute top-[50px] flex flex-wrap gap-1">
      {count != null ? (
        <div className="px-2 text-xs font-extrabold bg-opacity-75 border rounded-lg bg-background">
          {hiddenByFilters && (
            <span
              className="inline-block w-1.5 h-1.5 mb-px mr-1 align-middle rounded-full bg-current"
              title="Some matches are hidden by your filters"
            >
              <span className="sr-only">
                Some matches are hidden by filters.
              </span>
            </span>
          )}
          {count} {count !== 1 ? "Items" : "Item"}{" "}
          {KANJI_COUNT !== count ? "Matched" : ""}
        </div>
      ) : null}
      <KnownBadge />
    </div>
  );
};

export const ItemCountBadge = () => {
  const result = useKanjiSearchResult();
  const searchSettings = useSearchSettings();
  const { type, text } = searchSettings.textSearch;
  const kanjiChars = [...new Set(text.split("").filter(isKanji))];

  if (result.data?.length == null) {
    return <ItemsCountLayout count={null} />;
  }

  // Count the tiles the list shows (getFinalResults), not the kanji typed.
  // With no filters every pasted kanji gets a tile, even ones we don't have;
  // with filters only the matches do, and the dot says some were hidden.
  if (type === "multi-kanji" && kanjiChars.length > 0) {
    const shown = getFinalResults(searchSettings, result.data).length;
    return (
      <ItemsCountLayout
        count={shown}
        hiddenByFilters={shown < kanjiChars.length}
      />
    );
  }

  return <ItemsCountLayout count={result.data.length} />;
};
