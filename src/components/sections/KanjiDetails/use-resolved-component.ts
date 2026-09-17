import {
  useGetKanjiInfoFn,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { isKnownRadical } from "@/lib/radicals";

export const useResolvedComponent = (component: string | null | undefined) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  const radicals = useRadicals();
  if (!component) return null;
  const info = getKanjiInfo?.(component) ?? null;
  const isKanji = !!info && "on" in info;
  const keyword = info?.keyword;
  return {
    component,
    keyword: keyword ?? "...",
    type: (isKanji
      ? "kanji"
      : isKnownRadical(component, radicals) || keyword
        ? "radical"
        : "unknown") as "kanji" | "radical" | "unknown",
  };
};
