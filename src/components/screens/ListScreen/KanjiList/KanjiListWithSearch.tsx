import { useDeferredItemSettings } from "@/providers/item-settings-hooks";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { DefaultErrorFallback } from "@/components/error";
import { VirtualKanjiList } from "./VirtualKanjiList";
import LoadingKanjis from "./LoadingKanjis";
import { NoSearchResults } from "@/components/error/NoSearchResults";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { isKanji, dedupe } from "@/lib/utils";

const KanjiListWithSearch = () => {
  const result = useKanjiSearchResult();
  const itemSettings = useDeferredItemSettings();
  const searchSettings = useSearchSettings();

  if (result.error != null) {
    return <DefaultErrorFallback message="Failed to load data." />;
  }

  if (result.data == null) {
    return <LoadingKanjis />;
  }

  const { type, text } = searchSettings.textSearch;
  const kanjiChars = text.split("").filter(isKanji);
  const uniqueKanjiChars = dedupe(kanjiChars);

  if (type === "multi-kanji" && uniqueKanjiChars.length > 0) {
    return <VirtualKanjiList kanjiKeys={uniqueKanjiChars} size={itemSettings.cardType} />
  }

  if (result.data.length === 0) {
    return <NoSearchResults />;
  }

  if (type === "multi-kanji" && uniqueKanjiChars.length > 0) {
    return <VirtualKanjiList kanjiKeys={uniqueKanjiChars} size={itemSettings.cardType} />
  }

  return (
    <VirtualKanjiList kanjiKeys={result.data} size={itemSettings.cardType} />
  );
};

export default KanjiListWithSearch;
