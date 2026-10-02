import { useMemo } from "react";
import { useDeferredItemSettings } from "@/providers/item-settings-hooks";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { DefaultErrorFallback } from "@/components/error";
import { VirtualKanjiList } from "./VirtualKanjiList";
import LoadingKanjis from "./LoadingKanjis";
import { NoSearchResults } from "@/components/error/NoSearchResults";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { getFinalResults } from "@/lib/results-utils";

const KanjiListWithSearch = () => {
  const result = useKanjiSearchResult();
  const itemSettings = useDeferredItemSettings();
  const searchSettings = useSearchSettings();

  // Memoized: VirtualKanjiList is React.memo'd, and the sort/filter paths of
  // getFinalResults build a fresh array — a stable identity keeps the memo
  // effective.
  const kanjiKeys = useMemo(
    () =>
      result.data == null ? [] : getFinalResults(searchSettings, result.data),
    [searchSettings, result.data]
  );

  if (result.error != null) {
    return <DefaultErrorFallback message="Failed to load data." />;
  }

  if (result.data == null) {
    return <LoadingKanjis />;
  }

  if (kanjiKeys.length === 0) {
    return <NoSearchResults />;
  }

  return (
    <VirtualKanjiList kanjiKeys={kanjiKeys} size={itemSettings.cardType} />
  );
};

export default KanjiListWithSearch;
