import { useLocation, useSearch, useSearchParams } from "wouter";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { URL_PARAMS } from "@/lib/settings/url-params";
import usePrevious from "@/hooks/use-previous";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";

export const useKanjiUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const setOpenedKanji = useCallback(
    (kanji: string | null) => {
      setSearchParams((prev) => {
        if (kanji == null) {
          prev.delete(URL_PARAMS.openKanji);
          return prev;
        }

        prev.set(URL_PARAMS.openKanji, kanji);
        return prev;
      });
    },
    [setSearchParams]
  );
  const openedKanji = searchParams.get(URL_PARAMS.openKanji);

  return [openedKanji, setOpenedKanji] as [
    string,
    (kanji: string | null) => void,
  ];
};

/* keep the previous url but change the kanji to the new kanji */
export const useKanjiFromUrl = (kanji: string) => {
  const [params] = useSearchParams();

  const urlState = useMemo(() => {
    params.delete(URL_PARAMS.openKanji);
    params.set(URL_PARAMS.openKanji, kanji);
    return params.toString();
  }, [kanji, params]);

  return urlState;
};

const buildKanjiParamStr = (paramStr: string, kanji: string) => {
  const params = new URLSearchParams(paramStr);
  params.delete(URL_PARAMS.openKanji);
  params.set(URL_PARAMS.openKanji, kanji);
  return params.toString();
};

export const useNextPrevUrls = (currentKanji: string) => {
  const kanjisData = useKanjiSearchResult();
  const [params] = useSearchParams();

  const nextPrevUrls = useMemo(() => {
    const kanjis = kanjisData.data;

    if (kanjis == null || kanjis.length <= 0) {
      return null;
    }

    const paramsStr = params.toString();
    const index = kanjis.findIndex((kanji) => kanji == currentKanji);

    // not in current displayed kanjis
    if (index === -1) {
      return {
        next: buildKanjiParamStr(paramsStr, kanjis[0]),
      };
    }

    // the current kanji is the only one in the list
    if (kanjis.length === 1) {
      return null;
    }

    return {
      next:
        index + 1 === kanjis.length
          ? null
          : buildKanjiParamStr(paramsStr, kanjis[index + 1]),
      prev:
        index === 0 ? null : buildKanjiParamStr(paramsStr, kanjis[index - 1]),
    };
  }, [currentKanji, kanjisData, params]);

  return nextPrevUrls;
};

export const useUrlLocation = () => {
  const [location] = useLocation();
  return location;
};

/* 

  UPDATE: This is unused for now 

  Increments key everytime user has
  gone from "/?xxxx" to "/" or viceversia
  this is used to keep the search bar value 
  correct
*/
export const useHasNavigatedToHomeKey = () => {
  const [key, setKey] = useState(0);
  const [location] = useLocation();
  const searchString = useSearch();
  const previousLocation = usePrevious(location);
  const previousSearchString = usePrevious(searchString);

  const wasAlreadyInHome = previousLocation === location;
  const notSameSearchString =
    (searchString ?? "") !== (previousSearchString ?? "");

  const isOpen = searchString.includes(URL_PARAMS.openKanji);
  const wasPreviousOpen = previousSearchString?.includes(URL_PARAMS.openKanji);

  const justClosedDrawer = wasAlreadyInHome && !isOpen && wasPreviousOpen;

  const shouldRefocus =
    wasAlreadyInHome && notSameSearchString && !justClosedDrawer && !isOpen;
  useLayoutEffect(() => {
    if (shouldRefocus) {
      setKey((key) => key + 1);
    }
  }, [shouldRefocus]);

  return key;
};

// Create an url param with only the existing search-text and search-type
// e.g search-text=xxx&search-type=meanings
export const useClearedUrl = () => {
  const [searchParams] = useSearchParams();

  const searchText = searchParams.get(URL_PARAMS.textSearch.text);
  const searchType = searchParams.get(URL_PARAMS.textSearch.type);

  const hasText = (searchText ?? "").length > 0;
  const hasType = (searchType ?? "").length > 0;
  const textString = hasText
    ? `${URL_PARAMS.textSearch.text}=${searchText}`
    : "";

  const typeString = hasType
    ? `&${URL_PARAMS.textSearch.type}=${searchType}`
    : "";

  const link = `${textString}${typeString}`;
  return encodeURI(link);
};

export { useSearchParams };
