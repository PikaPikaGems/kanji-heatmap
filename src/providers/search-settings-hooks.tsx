import { createContextComponents, useContextWithCatch } from "./helpers";
import { SearchSettings } from "@/lib/settings/settings";
import { MAX_FREQ_RANK, MAX_STROKE_COUNT } from "@/lib/options/constants";
import { JLPT_TYPE_ARR } from "@/lib/jlpt";
import { JOUYOU_GRADE_TYPE_ARR } from "@/lib/jouyou-grade";

export const searchSettings = createContextComponents<SearchSettings>({
  textSearch: {
    type: "readings",
    text: "",
  },
  filterSettings: {
    strokeRange: { min: 1, max: MAX_STROKE_COUNT },
    jlpt: JLPT_TYPE_ARR.map((r) => r),
    jouyouGrade: JOUYOU_GRADE_TYPE_ARR.map((grade) => grade),
    freq: {
      source: "none" as const,
      rankRange: { min: 1, max: MAX_FREQ_RANK },
    },
    bookmarkedOnly: false,
    withAnchorWordsOnly: false,
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
