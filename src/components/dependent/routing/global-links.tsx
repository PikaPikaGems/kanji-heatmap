import { cnTextLink } from "@/lib/generic-cn";
import { Badge } from "@/components/ui/badge";
import { useKanjiFromUrl } from "./routing-hooks";
import { Link } from "./router-adapter";
import { radicalFalseFriends } from "@/lib/radicals";

export const GlobalHomeLink = () => {
  return (
    <Link to={"/"} className={cnTextLink}>
      home.
    </Link>
  );
};

export const GlobalRadicalLink = ({
  radical,
  keyword,
}: {
  radical: string;
  keyword: string;
}) => {


  return (
    <Link
      to={`/?search-type=radicals&search-text=${radicalFalseFriends[radical] ?? radical}`}
      className={
        "flex flex-col m-1 p-1 text-xl hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md"
      }
    >
      <Badge className="justify-center text-center border border-black border-opacity-50" variant="secondary">{keyword}</Badge>
      <div className="kanji-font">{radical}</div>
    </Link>
  );
};

export const FakeComponentLink = ({
  radical,
  keyword
}: {
  radical: string;
  keyword?: string
}) => {


  return (
    <div
      className={
        "flex flex-col m-1 p-1 text-xl rounded-md"
      }
    >
      <Badge className="justify-center text-center border-black border-dashed opacity-50 border-opacity-2" variant="outline">{keyword ?? "..."}</Badge>
      <div className="kanji-font">{radical}</div>
    </div>
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
      <Badge className="justify-center text-center">{keyword}</Badge>
      <div className="kanji-font">{kanji}</div>
    </Link>
  );
};

export const GlobalHomeHeaderLink = () => {
  return <Link to={"/"}>Kanji Heatmap</Link>;
};
