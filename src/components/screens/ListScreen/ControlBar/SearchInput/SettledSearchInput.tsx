import { SearchType } from "@/lib/settings/settings";
import {
  useSearchSettings,
  useSearchSettingsDispatch,
} from "@/providers/search-settings-hooks";
import { SearchInput } from "./SearchInput";
import { useCallback } from "react";

export const SettledSearchInput = () => {
  const dispatch = useSearchSettingsDispatch();
  const settings = useSearchSettings();

  const onSettle = useCallback(
    (text: string, searchType: SearchType) => {
      dispatch("textSearch", { text, type: searchType });
    },
    [dispatch]
  );

  return (
    <>
      <SearchInput
        onSettle={onSettle}
        initialText={settings.textSearch.text}
        initialSearchType={settings.textSearch.type}
      />
    </>
  );
};
