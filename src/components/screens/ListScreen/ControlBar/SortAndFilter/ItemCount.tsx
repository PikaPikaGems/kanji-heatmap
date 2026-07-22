import { useDeferredValue } from "react";
import { KANJI_COUNT } from "@/lib/options/constants";
import { SearchSettings } from "@/lib/settings/settings";
import { shouldShowAllKanji } from "@/lib/results-utils";

import { useKanjiSearchCount } from "@/kanji-worker/kanji-worker-hooks";
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

const ItemCountComputed = ({ settings }: { settings: SearchSettings }) => {
  const data = useKanjiSearchCount(settings);

  if (data.data == null || data.error) {
    return null;
  }

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

  if (data.data >= KANJI_COUNT) {
    return <AllMatchMsg />;
  }

  const textSuffix =
    settings.filterSettings.freq.source !== "none" ? disclaimer : null;

  if (data.data === 0) {
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
      <span className="font-extrabold mx-1">{data.data}</span> of
      <span className="font-extrabold mx-1"> {KANJI_COUNT}</span>
      Kanji characters match your applied filters. <br />
      {textSuffix}
    </>
  );
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
