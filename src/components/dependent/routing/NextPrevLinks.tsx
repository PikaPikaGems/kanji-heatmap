import { useMemo } from "react";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-utils";
import { cn } from "@/lib/utils";
import { useSearchParams } from "@/hooks/routing-hooks";
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

// Links aren't <Button>, so borrow the same visual via buttonVariants.
const btnLinkCn = cn(
  buttonVariants({ variant: "outline", size: "iconXl" }),
  "relative"
);
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
          size="iconXl"
          variant={"outline"}
          className="relative cursor-not-allowed"
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
          size="iconXl"
          variant={"outline"}
          className="relative cursor-not-allowed"
        >
          <ArrowRight />
        </Button>
      )}
    </>
  );
};
