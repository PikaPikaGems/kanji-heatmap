import type { ReactNode } from "react";
import { cnTextLink } from "@/lib/generic-cn";
import { Badge } from "@/components/ui/badge";
import { DottedSeparator } from "@/components/ui/dotted-separator";
import { GenericPopover } from "@/components/common/GenericPopover";
import { BookOpen, Search } from "@/components/icons";
import { useKanjiFromUrl, useUrlLocation } from "@/hooks/routing-hooks";
import {
  useGetKanjiInfoFn,
  useRadicalPopoverText,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { Link } from "./router-adapter";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { RadicalDetailsDialogContent } from "@/components/dependent/site-wide/RadicalDetailsDialog";
import {
  radicalInfo,
  RadicalPopoverDetails,
  resolveRadicalForSearch,
} from "@/lib/radicals";

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

/** One link at the bottom of the radical popover: icon, then underlined text. */
const PopoverAction = ({
  to,
  icon,
  children,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1.5 py-1 text-xs font-bold text-left w-fit hover:text-neon-accent"
  >
    {icon}
    <span className="underline decoration-dotted underline-offset-4">
      {children}
    </span>
  </Link>
);

export const RadicalSearchAction = ({ radical }: { radical: string }) => {
  const radicals = useRadicals();
  const searchText = resolveRadicalForSearch(radical, radicals);
  return (
    <PopoverAction
      to={radicalSearchHref(searchText)}
      icon={<Search size={14} />}
    >
      Find kanji that include {searchText}
    </PopoverAction>
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

/** Opens the kanji page of a radical that is also a kanji (夕). */
const OpenKanjiAction = ({
  kanji,
  keyword,
}: {
  kanji: string;
  keyword: string;
}) => {
  const pathname = useUrlLocation();
  const urlState = useKanjiFromUrl(kanji);
  return (
    <PopoverAction to={`${pathname}?${urlState}`} icon={<BookOpen size={14} />}>
      Open kanji {kanji} ({keyword})
    </PopoverAction>
  );
};

const hasDetails = (text: RadicalPopoverDetails | null) =>
  text != null &&
  (text.ja != null ||
    text.cn != null ||
    (text.semantic ?? []).length > 0 ||
    (text.sound ?? []).length > 0);

export const RadicalPopoverContent = ({ radical }: { radical: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  const radicals = useRadicals();
  const info = radicalInfo(radical, radicals);
  const kanjiInfo = getKanjiInfo?.(radical);
  const keyword = kanjiInfo?.keyword;
  const isKanji = kanjiInfo != null && "on" in kanjiInfo;
  const { data: text } = useRadicalPopoverText(radical);
  const name = info == null ? "" : keyword ? `${info.ja}, ${keyword}` : info.ja;
  return (
    <div className="p-1 max-w-xs" data-vaul-no-drag>
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
          <div className="min-w-0 text-sm font-bold text-left whitespace-normal text-foreground">
            <p>🇯🇵 {name}</p>
            {info.cn && (
              <p>
                {"🇨🇳"} {(text?.semantic ?? []).length > 0 && "🧠 "}
                {info.cn}
              </p>
            )}
            {info.pos && (
              <p>
                📍 {info.pos} ({POSITION_EN[info.pos]})
              </p>
            )}
            {text?.sounds != null && <p>🔊 {text.sounds.join("・")}</p>}
            {text != null && hasDetails(text) && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-xs font-normal underline decoration-dotted underline-offset-4 hover:text-neon-accent"
                  >
                    view radical details →
                  </button>
                </DialogTrigger>
                <RadicalDetailsDialogContent
                  radical={radical}
                  text={text}
                  name={name}
                  english={info.cn}
                />
              </Dialog>
            )}
          </div>
        )}
      </div>
      <DottedSeparator className="mx-1 mt-3" />
      <div className="flex flex-col px-1 pt-2">
        <RadicalSearchAction radical={radical} />
        {isKanji && keyword && (
          <OpenKanjiAction kanji={radical} keyword={keyword} />
        )}
      </div>
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
