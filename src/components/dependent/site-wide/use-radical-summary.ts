import {
  useGetKanjiInfoFn,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { radicalInfo } from "@/lib/radicals";

const POSITION_EN: Record<string, string> = {
  へん: "left side",
  つくり: "right side",
  かんむり: "top",
  あし: "bottom",
  たれ: "top-left",
  にょう: "bottom-left",
  かまえ: "enclosure",
};

/** "へん (left side)", or null for a radical with no position. */
export const positionText = (pos?: string) =>
  pos ? `${pos} (${POSITION_EN[pos] ?? pos})` : null;

/**
 * A radical's Japanese name, info, position and kanji keyword, following
 * aliases: "さんずい, three water", "へん (left side)". Shared by the radical
 * popover and its dialog.
 */
export const useRadicalSummary = (radical: string) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  const radicals = useRadicals();
  const info = radicalInfo(radical, radicals);
  const kanjiInfo = getKanjiInfo?.(radical);
  const keyword = kanjiInfo?.keyword;
  const isKanji = kanjiInfo != null && "on" in kanjiInfo;
  const name = info == null ? "" : keyword ? `${info.ja}, ${keyword}` : info.ja;
  const position = positionText(info?.pos);
  return { info, keyword, isKanji, name, position };
};
