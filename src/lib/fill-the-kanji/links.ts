import { URL_PARAMS } from "@/lib/settings/url-params";
import { fillTheKanjiPageMeta } from "@/lib/pages/practice-pages";
import { FillTheKanjiSetId } from "./sets";

/** Build `/fill-the-kanji?set=<id>&batch=<n>` for deep links (e.g. dashboard). */
export const fillTheKanjiBatchHref = (
  setId: FillTheKanjiSetId,
  batch: number
) =>
  `${fillTheKanjiPageMeta.href}?${URL_PARAMS.fillTheKanjiSet}=${setId}&${URL_PARAMS.fillTheKanjiBatch}=${batch}`;
