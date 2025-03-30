import { useMemo } from "react";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "./routing-hooks";
import { Link } from "./router-adapter";
import { useNextPrevKanji } from "@/hooks/use-next-prev-kanji";

const buildKanjiParamStr = (paramStr: string, kanji: string) => {
  const params = new URLSearchParams(paramStr);
  params.delete(URL_PARAMS.openKanji);
  params.set(URL_PARAMS.openKanji, kanji);
  return params.toString();
};

const useNextPrevUrls = (currentKanji: string) => {
  const [params] = useSearchParams();
  const kanjis = useNextPrevKanji(currentKanji);
  const paramsStr = params.toString();

  const nextPrevUrls = useMemo(() => {
    if (kanjis == null) {
      return null;
    }

    return {
      prev: kanjis?.prev ? buildKanjiParamStr(paramsStr, kanjis?.prev) : null,
      next: kanjis?.next ? buildKanjiParamStr(paramsStr, kanjis?.next) : null,
    };
  }, [kanjis, paramsStr]);

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
