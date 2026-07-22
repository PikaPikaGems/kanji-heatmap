import { useDeferredValue } from "react";
import { KANJI_COUNT } from "@/lib/options/constants";
import { SearchSettings } from "@/lib/settings/settings";
import { needsClientListFilters } from "@/lib/client-list-filters";
import { shouldShowAllKanji } from "@/lib/results-utils";

import {
  useKanjiSearch,
  useKanjiSearchCount,
} from "@/kanji-worker/kanji-worker-hooks";
import { useClientFilteredKanjis } from "@/hooks/use-client-list-filters";
import { SEARCH_TYPE_OPTIONS } from "@/lib/search-input-maps";

const disclaimer =
  "Some kanji characters may be excluded based on your selected frequency source filter.";

const SEARCH_TEXT_DISPLAY_MAX = 200;

const formatSearchTextForDisplay = (text: string) => {
  if (text.length <= SEARCH_TEXT_DISPLAY_MAX) {
    return text;
  }
  return `${text.slice(0, SEARCH_TEXT_DISPLAY_MAX)}...`;
};

const AllMatchMsg = () => {
  return (
    <div className="block w-full text-right text-xs">
      All available Kanji (
      {<span className="font-extrabold mx-1">{KANJI_COUNT}</span>}) characters
      match your applied filters.
    </div>
  );
};

const MatchCountMessage = ({
  settings,
  count,
}: {
  settings: SearchSettings;
  count: number;
}) => {
  const textPrefix =
    settings.textSearch.text.length > 0 ? (
      <>
        Your Search Text is{" "}
        <span className="mx-1 font-extrabold">
          {`"${formatSearchTextForDisplay(settings.textSearch.text)}"`}
        </span>
        <span>{`(Search Type: ${SEARCH_TYPE_OPTIONS.find((item) => item.value === settings.textSearch.type)?.label} )`}</span>
        .
      </>
    ) : (
      ""
    );

  if (count >= KANJI_COUNT) {
    return <AllMatchMsg />;
  }

  const textSuffix =
    settings.filterSettings.freq.source !== "none" ? disclaimer : null;

  if (count === 0) {
    return (
      <>
        {textPrefix} No Kanji characters match your applied filters. <br />
        {textSuffix}
      </>
    );
  }

  return (
    <>
      {textPrefix} A total of{" "}
      <span className="font-extrabold mx-1">{count}</span> of
      <span className="font-extrabold mx-1"> {KANJI_COUNT}</span>
      Kanji characters match your applied filters. <br />
      {textSuffix}
    </>
  );
};

const ItemCountComputed = ({ settings }: { settings: SearchSettings }) => {
  const needsClient = needsClientListFilters(settings.filterSettings);
  const workerCount = useKanjiSearchCount(settings);
  const workerSearch = useKanjiSearch(settings);
  const { data: clientFiltered, isLoading: clientLoading } =
    useClientFilteredKanjis(workerSearch.data, settings.filterSettings);

  // Keep layout height stable while counts load so the dialog doesn't bounce.
  if (needsClient) {
    if (clientLoading || clientFiltered == null || workerSearch.error) {
      return (
        <span className="invisible" aria-hidden>
          A total of 0 of {KANJI_COUNT} Kanji characters match your applied
          filters.
          <br />
        </span>
      );
    }
    return (
      <MatchCountMessage settings={settings} count={clientFiltered.length} />
    );
  }

  if (workerCount.data == null || workerCount.error) {
    return (
      <span className="invisible" aria-hidden>
        A total of 0 of {KANJI_COUNT} Kanji characters match your applied
        filters.
        <br />
      </span>
    );
  }

  return <MatchCountMessage settings={settings} count={workerCount.data} />;
};

export const ItemCount = ({ settings }: { settings: SearchSettings }) => {
  const deferredSettings = useDeferredValue(settings);
  const shouldShowAll = shouldShowAllKanji(deferredSettings);

  if (shouldShowAll) {
    return <AllMatchMsg />;
  }

  return (
    <div className="block w-full text-right text-xs">
      <ItemCountComputed settings={deferredSettings} />
    </div>
  );
};
