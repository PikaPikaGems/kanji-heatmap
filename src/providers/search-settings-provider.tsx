import {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import {
  FilterSettings,
  SearchSettings,
  SortSettings,
  TextSearch,
} from "@/lib/settings/settings";
import {
  defaultSearchType,
  toSearchParams,
  toSearchSettings,
} from "@/lib/settings/search-settings-adapter";
import {
  getLastHomeSearchParams,
  rememberHomeSearchParams,
} from "@/lib/settings/last-home-search-params";
import {
  useSearchParams,
  useUrlLocation,
} from "@/components/dependent/routing/routing-hooks";
import { searchSettings } from "./search-settings-hooks";
import { URL_PARAMS } from "@/lib/settings/url-params";

const ALLOWED_LOCATIONS = ["/"];

const isEmptySearchParams = (params: URLSearchParams) => {
  return [...params.keys()].length === 0;
};

const normalizeSearchParams = (params: URLSearchParams) => {
  const searchSettings = toSearchSettings(params);
  const partial1 = toSearchParams(
    params,
    "textSearch",
    searchSettings.textSearch
  );
  const partial2 = toSearchParams(
    partial1,
    "filterSettings",
    searchSettings.filterSettings
  );
  return toSearchParams(partial2, "sortSettings", searchSettings.sortSettings);
};

export function SearchSettingsProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useUrlLocation();
  // When landing on bare `/`, the restore write and the "remember" sync can
  // run in the same commit while searchParams is still empty. Skip that one
  // empty remember so we do not clobber the session cache mid-restore.
  const skipEmptyRememberRef = useRef(false);

  const updateItem = useCallback(
    (
      key: keyof SearchSettings,
      value: TextSearch | FilterSettings | SortSettings
    ) => {
      setSearchParams((prev) => {
        // if only text search type is changed, but no search text
        // then no transformation should be done in the URL
        if (key === "textSearch") {
          const newVal = value as TextSearch;
          const oldSearchText = prev.get(URL_PARAMS.textSearch.text) ?? "";
          const oldSearchType =
            prev.get(URL_PARAMS.textSearch.type) ?? defaultSearchType;
          // Skip only when nothing meaningful changed: still no search text AND
          // the search type already matches what's in the URL. Otherwise a type
          // switch (e.g. radicals -> handwriting) with empty text would never
          // be written, leaving the URL stuck on the previous type.
          if (
            newVal.text === "" &&
            oldSearchText === "" &&
            oldSearchType === newVal.type
          ) {
            return prev;
          }
        }

        return toSearchParams(prev, key, value);
      });
    },
    [setSearchParams]
  );

  useLayoutEffect(() => {
    // we do not dabble with the search params on pages where we shouldn't such as `/docs`
    if (!ALLOWED_LOCATIONS.includes(location)) {
      return;
    }
    setSearchParams(
      (prev) => {
        // Bare `/` links drop the query string. Rehydrate the last home search
        // from this session so filters/sort/bg-src/search survive navigation.
        const cached = getLastHomeSearchParams();
        const shouldRestore = isEmptySearchParams(prev) && Boolean(cached);
        if (shouldRestore) {
          skipEmptyRememberRef.current = true;
        }

        const base = shouldRestore
          ? new URLSearchParams(cached as string)
          : prev;
        const final = normalizeSearchParams(base);
        rememberHomeSearchParams(final);
        return final;
      },
      { replace: true }
    );
  }, [setSearchParams, location]);

  useLayoutEffect(() => {
    if (!ALLOWED_LOCATIONS.includes(location)) {
      return;
    }
    if (skipEmptyRememberRef.current && isEmptySearchParams(searchParams)) {
      skipEmptyRememberRef.current = false;
      return;
    }
    skipEmptyRememberRef.current = false;
    rememberHomeSearchParams(searchParams);
  }, [location, searchParams]);

  const storageData: SearchSettings = useMemo(() => {
    return toSearchSettings(searchParams);
  }, [searchParams]);

  return (
    <searchSettings.StateContext.Provider value={storageData}>
      <searchSettings.DispatchContext.Provider value={updateItem}>
        {children}
      </searchSettings.DispatchContext.Provider>
    </searchSettings.StateContext.Provider>
  );
}
