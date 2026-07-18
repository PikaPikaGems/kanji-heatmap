import { useLocation, useSearchParams } from "./router-adapter";
import { useCallback, useMemo } from "react";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { FrequencyType } from "@/lib/options/options-types";
import { K_RANK_GOOGLE } from "@/lib/options/options-constants";

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

export const useOpenedParam = () => {
  const [searchParams] = useSearchParams();
  const openedKanji = searchParams.get(URL_PARAMS.openKanji);
  return openedKanji;
};

export const useSetOpenedParam = () => {
  const setSearchParams = useSearchParams()[1];
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

  return setOpenedKanji;
};

export const useKanjiUrlState = () => {
  const openedKanji = useOpenedParam();
  const setOpenedKanji = useSetOpenedParam();

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

export { useSearchParams };
