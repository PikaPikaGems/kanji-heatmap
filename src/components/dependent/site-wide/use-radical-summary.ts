import {
  useGetKanjiInfoFn,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { radicalInfo } from "@/lib/radicals";

/**
 * A radical's Japanese name, info and kanji keyword, following aliases:
 * "さんずい, three water". Shared by the radical popover and its dialog.
 */
export const useRadicalSummary = (radical: string) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  const radicals = useRadicals();
  const info = radicalInfo(radical, radicals);
  const kanjiInfo = getKanjiInfo?.(radical);
  const keyword = kanjiInfo?.keyword;
  const isKanji = kanjiInfo != null && "on" in kanjiInfo;
  const name = info == null ? "" : keyword ? `${info.ja}, ${keyword}` : info.ja;
  return { info, keyword, isKanji, name };
};
