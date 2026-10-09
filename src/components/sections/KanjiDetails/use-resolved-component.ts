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
    // A radical opens the radical popover even when it is also a kanji (夕);
    // the popover links to the kanji.
    type: (isKnownRadical(component, radicals)
      ? "radical"
      : isKanji
        ? "kanji"
        : "unknown") as "kanji" | "radical" | "unknown",
  };
};
