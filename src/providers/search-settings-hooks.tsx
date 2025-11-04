import { createContextComponents, useContextWithCatch } from "./helpers";
import { SearchSettings } from "@/lib/settings/settings";
import { MAX_FREQ_RANK, MAX_STROKE_COUNT } from "@/lib/options/constants";
import { JLPT_TYPE_ARR } from "@/lib/jlpt";

export const searchSettings = createContextComponents<SearchSettings>({
  textSearch: {
    type: "readings",
    text: "",
  },
  filterSettings: {
    strokeRange: { min: 1, max: MAX_STROKE_COUNT },
    jlpt: JLPT_TYPE_ARR.map((r) => r),
    freq: {
      source: "none" as const,
      rankRange: { min: 1, max: MAX_FREQ_RANK },
    },
  },
  sortSettings: {
    primary: "none",
    secondary: "none",
  },
});

const providerName = "SearchSettings";

export function useSearchSettings() {
  const context = useContextWithCatch(
    searchSettings.StateContext,
    providerName
  );
  return context;
}

export function useSearchSettingsDispatch() {
  const context = useContextWithCatch(
    searchSettings.DispatchContext,
    providerName,
    `${providerName}Dispatch`
  );
  return context;
}
