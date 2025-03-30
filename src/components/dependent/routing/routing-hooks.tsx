import { useLocation, useSearch, useSearchParams } from "./router-adapter";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { URL_PARAMS } from "@/lib/settings/url-params";
import usePrevious from "@/hooks/use-previous";

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

export { useSearchParams };
