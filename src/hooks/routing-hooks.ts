import { useLocation, useSearchParams } from "wouter";
import { useCallback, useEffect, useMemo } from "react";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { FrequencyType } from "@/lib/options/options-types";
import { K_RANK_GOOGLE } from "@/lib/options/options-constants";
import { isKanji } from "@/lib/utils";

export const useBgSrc = () => {
  const [searchParams] = useSearchParams();
  const item = searchParams.get(URL_PARAMS.bgSrc);
  return item == null ? K_RANK_GOOGLE : (item as FrequencyType);
};

export const useBgSrcDispatch = () => {
  const setSearchParams = useSearchParams()[1];
  const dispatch = useCallback(
    (src: FrequencyType | null) => {
      setSearchParams((prev) => {
        if (src == null) {
          prev.delete(URL_PARAMS.bgSrc);
          return prev;
        }

        prev.set(URL_PARAMS.bgSrc, src);
        return prev;
      });
    },
    [setSearchParams]
  );

  return dispatch;
};

/** `?open=` must be exactly one CJK kanji character (e.g. 水), nothing else. */
export const isValidOpenKanjiParam = (value: string | null): value is string =>
  value != null && value.length === 1 && isKanji(value);

export const useOpenedParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawOpenedKanji = searchParams.get(URL_PARAMS.openKanji);
  const openedKanji = isValidOpenKanjiParam(rawOpenedKanji)
    ? rawOpenedKanji
    : null;

  // Needed: scrub invalid `?open=` values from the browser URL (external
  // system). Returning null above already keeps the drawer closed; this
  // effect removes the param so it is as if it was never present. No
  // render-time API can rewrite search params.
  useEffect(() => {
    if (rawOpenedKanji == null || isValidOpenKanjiParam(rawOpenedKanji)) {
      return;
    }
    setSearchParams((prev) => {
      prev.delete(URL_PARAMS.openKanji);
      return prev;
    });
  }, [rawOpenedKanji, setSearchParams]);

  return openedKanji;
};

export const useSetOpenedParam = () => {
  const setSearchParams = useSearchParams()[1];
  const setOpenedKanji = useCallback(
    (kanji: string | null) => {
      setSearchParams((prev) => {
        if (kanji == null || !isValidOpenKanjiParam(kanji)) {
          prev.delete(URL_PARAMS.openKanji);
          return prev;
        }

        prev.set(URL_PARAMS.openKanji, kanji);
        return prev;
      });
    },
    [setSearchParams]
  );

  return setOpenedKanji;
};

export const useKanjiUrlState = () => {
  const openedKanji = useOpenedParam();
  const setOpenedKanji = useSetOpenedParam();

  return [openedKanji, setOpenedKanji] as [
    string | null,
    (kanji: string | null) => void,
  ];
};

/* keep the previous url but change the kanji to the new kanji */
export const useKanjiFromUrl = (kanji: string) => {
  const [params] = useSearchParams();

  const urlState = useMemo(() => {
    // Clone before editing — the params object is shared router state.
    const next = new URLSearchParams(params);
    next.set(URL_PARAMS.openKanji, kanji);
    return next.toString();
  }, [kanji, params]);

  return urlState;
};

export const useUrlLocation = () => {
  const [location] = useLocation();
  return location;
};

export { useSearchParams };
