import { useMemo } from "react";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "./routing-hooks";
import { Link } from "./router-adapter";

const buildKanjiParamStr = (paramStr: string, kanji: string) => {
  const params = new URLSearchParams(paramStr);
  params.delete(URL_PARAMS.openKanji);
  params.set(URL_PARAMS.openKanji, kanji);
  return params.toString();
};

const useNextPrevUrls = (currentKanji: string) => {
  const kanjisData = useKanjiSearchResult();
  const [params] = useSearchParams();

  const nextPrevUrls = useMemo(() => {
    const kanjis = kanjisData.data;

    if (kanjis == null || kanjis.length <= 0) {
      return null;
    }

    const paramsStr = params.toString();
    const index = kanjis.findIndex((kanji) => kanji == currentKanji);

    // not in current displayed kanjis
    if (index === -1) {
      return {
        next: buildKanjiParamStr(paramsStr, kanjis[0]),
      };
    }

    // the current kanji is the only one in the list
    if (kanjis.length === 1) {
      return null;
    }

    return {
      next:
        index + 1 === kanjis.length
          ? null
          : buildKanjiParamStr(paramsStr, kanjis[index + 1]),
      prev:
        index === 0 ? null : buildKanjiParamStr(paramsStr, kanjis[index - 1]),
    };
  }, [currentKanji, kanjisData, params]);

  return nextPrevUrls;
};

const btnLinkCn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 relative rounded-xl";
export const NextPrevLinks = ({ currentKanji }: { currentKanji: string }) => {
  const links = useNextPrevUrls(currentKanji);
  return (
    <>
      {links?.prev ? (
        <Link className={btnLinkCn} to={`?${links.prev}`}>
          <ArrowLeft />
        </Link>
      ) : (
        <Button
          disabled
          size="icon"
          variant={"outline"}
          className="h-8 w-8 relative rounded-xl cursor-not-allowed"
        >
          <ArrowLeft />
        </Button>
      )}
      {links?.next ? (
        <Link className={btnLinkCn} to={`?${links.next}`}>
          <ArrowRight />
        </Link>
      ) : (
        <Button
          disabled
          size="icon"
          variant={"outline"}
          className="h-8 w-8 relative rounded-xl cursor-not-allowed"
        >
          <ArrowRight />
        </Button>
      )}
    </>
  );
};
