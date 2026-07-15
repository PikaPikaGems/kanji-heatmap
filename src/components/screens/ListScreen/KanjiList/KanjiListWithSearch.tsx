import { useDeferredItemSettings } from "@/providers/item-settings-hooks";
import {
  useGetKanjiInfoFn,
  useKanjiSearchResult,
} from "@/kanji-worker/kanji-worker-hooks";
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
  const getBasicInfo = useGetKanjiInfoFn();

  if (result.error != null) {
    return <DefaultErrorFallback message="Failed to load data." />;
  }

  if (result.data == null) {
    return <LoadingKanjis />;
  }

  const kanjiKeys = getFinalResults(
    searchSettings,
    result.data,
    getBasicInfo
  );

  if (kanjiKeys.length === 0) {
    return <NoSearchResults />;
  }

  return (
    <VirtualKanjiList kanjiKeys={kanjiKeys} size={itemSettings.cardType} />
  );
};

export default KanjiListWithSearch;
