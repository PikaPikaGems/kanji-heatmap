import { Link, Route, Switch } from "wouter";
import { cnTextLink } from "@/lib/generic-cn";
import { Badge } from "@/components/ui/badge";
import { useKanjiFromUrl, useNextPrevUrls } from "./routing-hooks";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GlobalHomeLink = () => {
  return (
    <Link to={"/"} className={cnTextLink}>
      home.
    </Link>
  );
};

export const GlobalKanjiLink = ({
  kanji,
  keyword,
}: {
  kanji: string;
  keyword: string;
}) => {
  const urlState = useKanjiFromUrl(kanji);
  return (
    <Link
      to={`/?${urlState}`}
      className={
        "flex flex-col m-1 p-1 text-xl hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md"
      }
    >
      <Badge className="text-center justify-center">{keyword}</Badge>
      <div className="kanji-font">{kanji}</div>
    </Link>
  );
};

export const GlobalHomeHeaderLink = () => {
  return <Link to={"/"}>Kanji Heatmap</Link>;
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

export { Route, Switch, Link };
