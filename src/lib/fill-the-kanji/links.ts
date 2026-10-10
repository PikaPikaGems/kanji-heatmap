import { URL_PARAMS } from "@/lib/settings/url-params";
import { fillTheKanjiPageMeta } from "@/lib/pages/practice-pages";
import { FillTheKanjiSetId } from "./sets";

/** Build `/fill-the-kanji?set=<id>&round=<n>` for deep links (e.g. dashboard). */
export const fillTheKanjiRoundHref = (
  setId: FillTheKanjiSetId,
  round: number
) =>
  `${fillTheKanjiPageMeta.href}?${URL_PARAMS.fillTheKanjiSet}=${setId}&${URL_PARAMS.fillTheKanjiRound}=${round}`;
