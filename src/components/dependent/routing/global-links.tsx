import { cnTextLink } from "@/lib/generic-cn";
import { Badge } from "@/components/ui/badge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Search } from "@/components/icons";
import { useKanjiFromUrl, useUrlLocation } from "@/hooks/routing-hooks";
import {
  useGetKanjiInfoFn,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { Link } from "./router-adapter";
import { radicalInfo, resolveRadicalForSearch } from "@/lib/radicals";

export const ComponentLink = ({
  component,
  keyword,
  title,
  type,
}: {
  component: string;
  keyword: string;
  title?: string;
  type: "kanji" | "radical" | "unknown";
}) => {
  return (
    <div className="flex flex-col text-center w-fit ">
      {type === "kanji" ? (
        <GlobalKanjiLink kanji={component} keyword={keyword} />
      ) : type === "radical" ? (
        <GlobalRadicalLink radical={component} keyword={keyword} />
      ) : (
        <FakeComponentLink radical={component} keyword={keyword} />
      )}
      {title && (
        <div className="text-[10px] uppercase opacity-70 whitespace-nowrap">
          {title}
        </div>
      )}
    </div>
  );
};

type FontSize =
  | "text-xl"
  | "text-2xl"
  | "text-3xl"
  | "text-4xl"
  | "text-5xl"
  | "text-6xl"
  | "text-7xl"
  | "text-8xl"
  | "text-9xl"
  | "text-10xl";

const cnJPCard = "flex flex-col m-1 p-1 text-xl rounded-md";
const cnJPCardLink = `${cnJPCard} hover:bg-foreground/5`;

const JPCardInner = ({
  label,
  character,
  fontSize = "text-3xl",
  badgeClassName,
  badgeVariant,
}: {
  label: string;
  character: string;
  fontSize?: FontSize;
  badgeClassName?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
}) => (
  <>
    <Badge
      className={`justify-center text-center whitespace-nowrap ${badgeClassName ?? ""}`}
      variant={badgeVariant}
    >
      {label === "Unknown" ? "..." : label}
    </Badge>
    <div className={`kanji-font whitespace-nowrap ${fontSize}`}>
      {character}
    </div>
  </>
);

export const GlobalHomeLink = () => {
  return (
    <Link to={"/"} className={cnTextLink}>
      home.
    </Link>
  );
};

const radicalSearchHref = (searchText: string) =>
  `/?search-type=radicals&search-text=${encodeURIComponent(searchText)}`;

const RadicalJpCard = ({
  radical,
  keyword,
  fontSize,
}: {
  radical: string;
  keyword: string;
  fontSize?: FontSize;
}) => (
  <JPCardInner
    label={keyword}
    character={radical}
    fontSize={fontSize}
    badgeClassName="border border-black border-opacity-50"
    badgeVariant="secondary"
  />
);

export const RadicalSearchAction = ({ radical }: { radical: string }) => {
  const radicals = useRadicals();
  const searchText = resolveRadicalForSearch(radical, radicals);
  return (
    <Link
      to={radicalSearchHref(searchText)}
      className="flex items-start gap-2 px-3 text-xs text-left transition-colors"
    >
      <span className="inline-flex items-center gap-1 p-2 text-xs leading-loose underline cursor-pointer decoration-dotted underline-offset-8 hover:text-neon-accent whitespace-nowrap">
        <Search size={14} />
        <strong>Find kanji that include {searchText}</strong>
      </span>
    </Link>
  );
};

const POSITION_EN: Record<string, string> = {
  へん: "left side",
  つくり: "right side",
  かんむり: "top",
  あし: "bottom",
  たれ: "top-left",
  にょう: "bottom-left",
  かまえ: "enclosure",
};

export const RadicalPopoverContent = ({ radical }: { radical: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  const radicals = useRadicals();
  const info = radicalInfo(radical, radicals);
  const keyword = getKanjiInfo?.(radical)?.keyword;
  return (
    <div className="p-1" data-vaul-no-drag>
      <div className="flex gap-3 px-1">
        <div className="flex items-center justify-center p-2 text-4xl leading-none size-14 rounded-xl bg-foreground/5 kanji-font">
          {radical}
        </div>
        {/* Drawer parts that aren't classic radicals (啇, 奄) have no radical
            info; show their keyword alone. */}
        {!info && keyword && (
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold whitespace-normal text-foreground">
              {keyword}
            </p>
          </div>
        )}
        {info && (
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold whitespace-normal text-foreground">
              🇯🇵 {keyword ? `${info.ja}, ${keyword}` : info.ja}
            </p>
            {info.pos && (
              <p className="text-xs whitespace-normal text-muted-foreground">
                📍 {info.pos} ({POSITION_EN[info.pos]})
              </p>
            )}
            {info.cn && (
              <p className="text-sm whitespace-normal text-foreground">
                {"🇨🇳"} {info.cn}
              </p>
            )}
          </div>
        )}
      </div>
      <RadicalSearchAction radical={radical} />
    </div>
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
    <GenericPopover
      modal
      contentClassName="z-[60] p-2"
      trigger={
        <button type="button" className={cnJPCardLink}>
          <RadicalJpCard
            radical={radical}
            keyword={keyword}
            fontSize={fontSize}
          />
        </button>
      }
      content={<RadicalPopoverContent radical={radical} />}
    />
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
  const pathname = useUrlLocation();
  const urlState = useKanjiFromUrl(kanji);
  return (
    <Link to={`${pathname}?${urlState}`} className={cnJPCardLink}>
      <JPCardInner label={keyword} character={kanji} fontSize={fontSize} />
    </Link>
  );
};

export const GlobalHomeHeaderLink = () => {
  return <Link to={"/"}>Kanji Heatmap</Link>;
};
