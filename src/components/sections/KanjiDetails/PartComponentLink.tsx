import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { ComponentLink } from "@/components/dependent/routing/global-links";
import {
  moreRadicalKeywords,
  nonRadicalVariantKeywords,
  radicalFalseFriends,
} from "@/lib/radicals";

const getRadicalKeyword = (component: string): string | undefined => {
  if (moreRadicalKeywords[component]) return moreRadicalKeywords[component];
  const canonical = radicalFalseFriends[component]?.trim();
  if (canonical && moreRadicalKeywords[canonical]) return moreRadicalKeywords[canonical];
  return undefined;
};

export const useResolvedComponent = (component: string | null | undefined) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  if (!component) return null;
  const info = getKanjiInfo?.(component ?? radicalFalseFriends[component]) ?? null;
  const isKanji = !!info && "on" in info;
  const keyword = info?.keyword ?? getRadicalKeyword(component);
  const nonRadicalKeyword = nonRadicalVariantKeywords[component] ?? "...";
  return {
    component,
    keyword: keyword ?? nonRadicalKeyword ?? "...",
    type: (isKanji ? "kanji" : keyword ? "radical" : "unknown") as
      | "kanji"
      | "radical"
      | "unknown",
  };
};

export const PartComponentLink = ({ part }: { part: string }) => {
  const props = useResolvedComponent(part);

  if (!props) {
    return null;
  }

  return <ComponentLink {...props} />;
};
