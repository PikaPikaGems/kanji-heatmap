import { cnTextLink } from "@/lib/generic-cn";
import { Badge } from "@/components/ui/badge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { Search } from "@/components/icons";
import { useKanjiFromUrl, useUrlLocation } from "@/hooks/routing-hooks";
import {
  useGetKanjiInfoFn,
  useRadicalPopoverText,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { Link } from "./router-adapter";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import {
  radicalInfo,
  RadicalPopoverDetails,
  RadicalPopoverText,
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

const SITE_NAMES: Record<string, string> = {
  "en.wiktionary.org": "Wiktionary",
  "ja.wikipedia.org": "Wikipedia (ja)",
  "en.wikipedia.org": "Wikipedia",
};

/** Every linked reference, grouped by site: "Wiktionary: 宀 客 宿". */
const RadicalSources = ({ text }: { text: RadicalPopoverText }) => {
  const refs = new Set([
    ...(text.jaRefs ?? []),
    ...(text.refs ?? []),
    ...(text.semantic ?? []).flatMap((example) => example.refs),
    ...(text.sound ?? []).flatMap((example) => example.refs),
  ]);
  const bySite = new Map<string, { href: string; page: string }[]>();
  for (const href of refs) {
    const url = new URL(href);
    const site = SITE_NAMES[url.hostname] ?? url.hostname;
    const page = decodeURIComponent(url.pathname.split("/").pop() ?? "");
    bySite.set(site, [...(bySite.get(site) ?? []), { href, page }]);
  }
  if (bySite.size === 0) return null;
  return (
    <div className="text-xs text-muted-foreground">
      {[...bySite].map(([site, links]) => (
        <p key={site}>
          {site}:{" "}
          {links.map(({ href, page }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="mr-1 underline decoration-dotted"
            >
              {page}
            </a>
          ))}
        </p>
      ))}
    </div>
  );
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
    <Link
      to={`${pathname}?${urlState}`}
      className="flex items-start gap-2 px-3 text-xs text-left transition-colors"
    >
      <span className="inline-flex items-center gap-1 p-2 text-xs leading-loose underline cursor-pointer decoration-dotted underline-offset-8 hover:text-neon-accent whitespace-nowrap">
        📖{" "}
        <strong>
          Open kanji {kanji} ({keyword})
        </strong>
      </span>
    </Link>
  );
};

const sectionHeadingCn =
  "mb-2 border-b-2 border-dotted text-xs font-extrabold uppercase tracking-widest text-muted-foreground text-left";

/**
 * Everything behind "view radical details": the reasons behind the names,
 * the meaning and sound examples, and the references. A dialog rather than
 * more popover, so each part gets its own heading and room.
 */
const RadicalDetailsDialogContent = ({
  radical,
  text,
  name,
  english,
}: {
  radical: string;
  text: RadicalPopoverDetails;
  name: string;
  english?: string;
}) => (
  <ScrollableDialogContent
    size="md"
    title={
      <span className="flex items-center gap-3">
        <span className="text-4xl kanji-font">{radical}</span>
        <span className="text-base">{name}</span>
      </span>
    }
    description={`Details for the radical ${radical}`}
  >
    <div className="space-y-5 text-sm text-left">
      {text.ja && (
        <section>
          <h3 className={sectionHeadingCn}>🇯🇵 Japanese name</h3>
          <p className="font-bold">{name}</p>
          <p className="text-muted-foreground">{text.ja}</p>
        </section>
      )}
      {text.cn && (
        <section>
          <h3 className={sectionHeadingCn}>🇨🇳 Origin</h3>
          <p className="font-bold">{english}</p>
          <p className="text-muted-foreground">{text.cn}</p>
        </section>
      )}
      {(text.semantic ?? []).length > 0 && (
        <section>
          <h3 className={sectionHeadingCn}>🧠 Semantic: {english}</h3>
          <ul className="space-y-2">
            {text.semantic?.map((example) => (
              <li key={example.kanji} className="flex gap-3">
                <span className="text-3xl leading-none kanji-font">
                  {example.kanji}
                </span>
                <span>
                  <span className="font-bold">{example.concepts}</span>
                  <br />
                  <span className="text-muted-foreground">{example.why}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {text.sounds != null && (text.sound ?? []).length > 0 && (
        <section>
          <h3 className={sectionHeadingCn}>
            🔊 Phonetic: {text.sounds.join("・")}
          </h3>
          <ul className="space-y-2">
            {text.sound?.map((example) => (
              <li key={example.kanji} className="flex gap-3">
                <span className="text-3xl leading-none kanji-font">
                  {example.kanji}
                </span>
                <span>
                  <span className="font-bold kanji-font">{example.word}</span>{" "}
                  {example.reading}
                  <br />
                  <span className="text-muted-foreground">{example.gloss}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3 className={sectionHeadingCn}>Sources</h3>
        <RadicalSources text={text} />
      </section>
    </div>
  </ScrollableDialogContent>
);

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
      <RadicalSearchAction radical={radical} />
      {isKanji && keyword && (
        <OpenKanjiAction kanji={radical} keyword={keyword} />
      )}
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
