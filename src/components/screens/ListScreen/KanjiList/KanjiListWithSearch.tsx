import { useDeferredItemSettings } from "@/providers/item-settings-hooks";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { DefaultErrorFallback } from "@/components/error";
import { VirtualKanjiList } from "./VirtualKanjiList";
import LoadingKanjis from "./LoadingKanjis";
import { NoSearchResults } from "@/components/error/NoSearchResults";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { isKanji } from "@/lib/utils";
import { useSetOpenedParam } from "@/components/dependent/routing/routing-hooks";

const UnknownKanjiList = ({ kanjis }: { kanjis: string[] }) => {
  const setKanji = useSetOpenedParam();
  return (
    <div className="flex flex-col items-center justify-center w-full gap-4 p-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {kanjis.map((kanji) => (
          <button
            key={kanji}
            className="p-6 text-6xl border-2 border-dotted rounded-3xl hover:bg-foreground/5"
            onClick={() => setKanji(kanji)}
          >
            {kanji}
          </button>
        ))}
      </div>
    </div>
  );
};

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

  if (result.data.length === 0) {
    const { type, text } = searchSettings.textSearch;
    const kanjiChars = text.split("").filter(isKanji);
    if (type === "multi-kanji" && kanjiChars.length > 0) {
      return <UnknownKanjiList kanjis={[...new Set(kanjiChars)]} />;
    }
    return <NoSearchResults />;
  }
  return (
    <VirtualKanjiList kanjiKeys={result.data} size={itemSettings.cardType} />
  );
};

export default KanjiListWithSearch;
