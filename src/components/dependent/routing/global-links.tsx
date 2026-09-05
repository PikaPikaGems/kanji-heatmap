import { cnTextLink } from "@/lib/generic-cn";
import { Badge } from "@/components/ui/badge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Search } from "@/components/icons";
import { useKanjiFromUrl, useUrlLocation } from "@/hooks/routing-hooks";
import { Link } from "./router-adapter";
import { radicalFalseFriends } from "@/lib/radicals";

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

const redirectRadical: Record<string, string> = {
  飠: "食",
};

const radicalSearchHref = (radical: string) => {
  const searchText =
    redirectRadical[radical] ?? radicalFalseFriends[radical] ?? radical;
  return `/?search-type=radicals&search-text=${encodeURIComponent(searchText)}`;
};

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

export const RadicalSearchAction = ({ radical }: { radical: string }) => (
  <Link
    to={radicalSearchHref(radical)}
    className="flex items-start gap-3 rounded-xl border-2 border-dashed p-2 text-left transition-colors hover:border-solid hover:border-[#2effff] hover:bg-[#2effff]/15"
  >
    <span className="flex items-center justify-center rounded-lg size-6 shrink-0 bg-foreground/5">
      <Search className="size-3" />
    </span>
    <span className="min-w-0">
      <span className="block text-xs font-bold leading-snug">
        Search by radical {radical}
      </span>
      <span className="mt-0.5 block text-[11px] font-light leading-snug text-muted-foreground">
        Find kanji that include {radical}
      </span>
    </span>
  </Link>
);

export const RadicalPopoverContent = ({
  radical,
  keyword,
}: {
  radical: string;
  keyword: string;
}) => {
  return (
    <div className="p-1" data-vaul-no-drag>
      <div className="flex items-center gap-3 px-1 pb-3">
        <div className="flex items-center justify-center text-4xl leading-none size-14 rounded-xl bg-foreground/5 kanji-font">
          {radical}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Radical
          </p>
          <p className="text-sm font-semibold truncate">{keyword}</p>
        </div>
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
      contentClassName="z-[60] w-[min(100vw-2rem,17.5rem)] p-0"
      trigger={
        <button type="button" className={cnJPCardLink}>
          <RadicalJpCard
            radical={radical}
            keyword={keyword}
            fontSize={fontSize}
          />
        </button>
      }
      content={<RadicalPopoverContent radical={radical} keyword={keyword} />}
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
