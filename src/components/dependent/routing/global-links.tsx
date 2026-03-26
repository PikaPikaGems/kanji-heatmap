import { cnTextLink } from "@/lib/generic-cn";
import { Badge } from "@/components/ui/badge";
import { useKanjiFromUrl } from "./routing-hooks";
import { Link } from "./router-adapter";
import { radicalFalseFriends } from "@/lib/radicals";

type FontSize = 'text-xl' | 'text-2xl' | 'text-3xl';

const cnJPCard = "flex flex-col m-1 p-1 text-xl rounded-md";
const cnJPCardLink = `${cnJPCard} hover:bg-foreground/5`;

const JPCardInner = ({
  label,
  character,
  fontSize = 'text-2xl',
  badgeClassName,
  badgeVariant,
}: {
  label: string;
  character: string;
  fontSize?: FontSize;
  badgeClassName?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>['variant'];
}) => (
  <>
    <Badge className={`justify-center text-center ${badgeClassName ?? ''}`} variant={badgeVariant}>{label}</Badge>
    <div className={`kanji-font ${fontSize}`}>{character}</div>
  </>
);

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
  fontSize,
}: {
  radical: string;
  keyword: string;
  fontSize?: FontSize;
}) => {
  return (
    <Link
      to={`/?search-type=radicals&search-text=${radicalFalseFriends[radical] ?? radical}`}
      className={cnJPCardLink}
    >
      <JPCardInner
        label={keyword}
        character={radical}
        fontSize={fontSize}
        badgeClassName="border border-black border-opacity-50"
        badgeVariant="secondary"
      />
    </Link>
  );
};

export const FakeComponentLink = ({
  radical,
  keyword,
  fontSize,
}: {
  radical: string;
  keyword?: string;
  fontSize?: FontSize;
}) => {
  return (
    <div className={cnJPCard}>
      <JPCardInner
        label={keyword ?? "..."}
        character={radical}
        fontSize={fontSize}
        badgeClassName="border-black border-dashed opacity-50 border-opacity-2"
        badgeVariant="outline"
      />
    </div>
  );
};

export const GlobalKanjiLink = ({
  kanji,
  keyword,
  fontSize,
}: {
  kanji: string;
  keyword: string;
  fontSize?: FontSize;
}) => {
  const urlState = useKanjiFromUrl(kanji);
  return (
    <Link to={`/?${urlState}`} className={cnJPCardLink}>
      <JPCardInner label={keyword} character={kanji} fontSize={fontSize} />
    </Link>
  );
};

export const GlobalHomeHeaderLink = () => {
  return <Link to={"/"}>Kanji Heatmap</Link>;
};
