import { ReactNode, useCallback, useLayoutEffect, useMemo } from "react";

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
  useSearchParams,
  useUrlLocation,
} from "@/components/dependent/routing/routing-hooks";
import { searchSettings } from "./search-settings-hooks";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { rememberHomeSearch } from "@/lib/home-search-memory";

const ALLOWED_LOCATIONS = ["/"];

export function SearchSettingsProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useUrlLocation();

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
        const searchSettings = toSearchSettings(prev);
        const partial1 = toSearchParams(
          prev,
          "textSearch",
          searchSettings.textSearch
        );
        const partial2 = toSearchParams(
          partial1,
          "filterSettings",
          searchSettings.filterSettings
        );
        const final = toSearchParams(
          partial2,
          "sortSettings",
          searchSettings.sortSettings
        );

        return final;
      },
      { replace: true }
    );
  }, [setSearchParams, location]);

  useLayoutEffect(() => {
    if (ALLOWED_LOCATIONS.includes(location)) {
      rememberHomeSearch(searchParams.toString());
    }
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
