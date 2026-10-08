import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { GenericPopover } from "@/components/common/GenericPopover";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GlobalKanjiLink } from "@/components/dependent/routing/global-links";
import { useState } from "react";
import { useRadicalSummary } from "./use-radical-summary";
import {
  useGetKanjiInfoFn,
  useRadicalPopoverText,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import {
  radicalFamily,
  radicalInfo,
  type RadicalPopoverDetails,
  type RadicalPopoverText,
} from "@/lib/radicals";

// The radical popover can sit at z-[60] (GlobalRadicalLink), so the
// dialog goes above it, and popovers opened inside the dialog above that.
const DIALOG_Z = "z-[70]";
const INNER_POPOVER_CN = "z-[80] w-auto p-0 m-0";

const sectionHeadingCn =
  "mb-2 border-b-2 border-dotted text-xs font-extrabold uppercase tracking-widest text-muted-foreground text-left";

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
  "www.kanjipedia.jp": "漢字ペディア",
};

/**
 * Every linked reference, grouped by site: "Wiktionary: 宀 客 宿". A link is
 * labeled with its example kanji when it has one (漢字ペディア's links end
 * in a page number), else with the last part of its path.
 */
const refsBySite = (text: RadicalPopoverText) => {
  const labels = new Map<string, string>();
  const add = (href: string, label?: string) => {
    if (labels.has(href)) return;
    labels.set(
      href,
      label ?? decodeURIComponent(new URL(href).pathname.split("/").pop() ?? "")
    );
  };
  for (const href of [...(text.jaRefs ?? []), ...(text.refs ?? [])]) add(href);
  for (const example of [...(text.semantic ?? []), ...(text.sound ?? [])]) {
    for (const href of example.refs ?? []) add(href, example.kanji);
  }
  const bySite = new Map<string, { href: string; page: string }[]>();
  for (const [href, page] of labels) {
    const site = SITE_NAMES[new URL(href).hostname] ?? new URL(href).hostname;
    bySite.set(site, [...(bySite.get(site) ?? []), { href, page }]);
  }
  return bySite;
};

const RadicalSources = ({
  bySite,
}: {
  bySite: ReturnType<typeof refsBySite>;
}) => (
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

/** An example kanji; tapping it offers the link to its kanji page. */
const ExampleKanji = ({ kanji }: { kanji: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  return (
    <GenericPopover
      contentClassName={INNER_POPOVER_CN}
      trigger={
        <button
          type="button"
          className="p-2.5 text-3xl leading-none border-2 border-dotted shrink-0 kanji-font rounded-xl hover:border-solid hover:border-neon-accent"
        >
          {kanji}
        </button>
      }
      content={
        <div className="p-2">
          <GlobalKanjiLink
            kanji={kanji}
            keyword={getKanjiInfo?.(kanji)?.keyword ?? "..."}
          />
        </div>
      }
    />
  );
};

const positionText = (pos?: string) =>
  pos ? `${pos} (${POSITION_EN[pos]})` : null;

/**
 * Every form of the radical (水 みず, ⺡ さんずい · へん, 氺 したみず), with the
 * one shown marked. A form with no glyph of its own (きへん) is shown with
 * the head glyph and can't be opened. A radical in no family shows one row,
 * so its position always has a place.
 */
const RadicalForms = ({
  radical,
  onSelect,
}: {
  radical: string;
  onSelect: (glyph: string) => void;
}) => {
  const radicals = useRadicals();
  const family = radicalFamily(radical, radicals);
  const members = family?.members ?? [radical];
  const current = family?.current ?? radical;
  return (
    <ul className="space-y-1">
      {members.map((member) => {
        const glyph = typeof member === "string" ? member : null;
        const info =
          typeof member === "string"
            ? radicalInfo(member, radicals)
            : { ja: member.ja, pos: member.pos };
        const isCurrent = glyph === current;
        const label = [info?.ja, positionText(info?.pos)]
          .filter(Boolean)
          .join(" · ");
        const shown = glyph ?? family?.head ?? radical;
        const row = (
          <>
            <span className="flex items-center justify-center text-2xl leading-none size-10 shrink-0 rounded-lg bg-foreground/5 kanji-font">
              {shown}
            </span>
            <span className={isCurrent ? "font-bold" : undefined}>
              {label}
              {isCurrent && members.length > 1 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (this one)
                </span>
              )}
            </span>
          </>
        );
        return (
          <li key={glyph ?? info?.ja}>
            {glyph != null && !isCurrent ? (
              <button
                type="button"
                onClick={() => onSelect(glyph)}
                className="flex items-center w-full gap-3 p-1 text-left rounded-lg hover:bg-foreground/5"
              >
                {row}
              </button>
            ) : (
              <div
                className={`flex items-center gap-3 p-1 ${glyph == null ? "opacity-60" : ""}`}
              >
                {row}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const RadicalDetailsBody = ({
  radical,
  onSelectForm,
}: {
  radical: string;
  onSelectForm: (glyph: string) => void;
}) => {
  const { info, name } = useRadicalSummary(radical);
  const { data } = useRadicalPopoverText(radical);
  const text: RadicalPopoverDetails = data ?? {};
  const english = info?.cn;
  const sources = refsBySite(text);
  return (
    <div className="space-y-5 text-sm text-left">
      {text.ja && (
        <section>
          <h3 className={sectionHeadingCn}>🇯🇵 Japanese name</h3>
          <p className="font-bold">{name}</p>
          <p className="text-muted-foreground">{text.ja}</p>
        </section>
      )}
      {info && (
        <section>
          <h3 className={sectionHeadingCn}>🧩 Forms</h3>
          <RadicalForms radical={radical} onSelect={onSelectForm} />
        </section>
      )}
      {(text.cn || text.cnNote) && (
        <section>
          <h3 className={sectionHeadingCn}>🇨🇳 Origin</h3>
          <p className="font-bold">{english}</p>
          {text.cn && <p className="text-muted-foreground">{text.cn}</p>}
          {text.cnNote && (
            <p className="text-muted-foreground">{text.cnNote}</p>
          )}
        </section>
      )}
      {(text.semantic ?? []).length > 0 && (
        <section>
          <h3 className={sectionHeadingCn}>🧠 Semantic: {english}</h3>
          <ul className="space-y-2">
            {text.semantic?.map((example) => (
              <li key={example.kanji} className="flex items-center gap-3">
                <ExampleKanji kanji={example.kanji} />
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
            🔊 Read like: {text.sounds.join("・")}
          </h3>
          <ul className="space-y-2">
            {text.sound?.map((example) => (
              <li key={example.kanji} className="flex items-center gap-3">
                <ExampleKanji kanji={example.kanji} />
                <ExampleWordPopover
                  word={example.word}
                  readingOverride={example.reading}
                  wordTranslationOverride={example.gloss}
                  contentClassName={INNER_POPOVER_CN}
                  className="px-3 py-2.5 text-xl"
                />
                <span className="min-w-0">
                  <RomajiBadge
                    kana={example.reading}
                    className="m-0 px-2 py-0.5 sm:py-0.5 text-sm sm:text-sm"
                  />
                  <br />
                  <span className="text-muted-foreground">{example.gloss}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {sources.size > 0 && (
        <section>
          <h3 className={sectionHeadingCn}>📚 Sources</h3>
          <RadicalSources bySite={sources} />
        </section>
      )}
    </div>
  );
};

/**
 * The radical's details, opened from the radical popover: its forms, the
 * reasons behind its names, the meaning and sound examples, and the
 * references. Tapping another form switches the dialog to it. Example kanji
 * open a kanji link, words open the vocab popover, and readings are kana
 * badges, as elsewhere in the app.
 */
export const RadicalDetailsDialogContent = ({
  radical,
}: {
  radical: string;
}) => {
  const [shown, setShown] = useState(radical);
  return (
    <ScrollableDialogContent
      size="md"
      className={DIALOG_Z}
      overlayClassName={DIALOG_Z}
      headerClassName="text-left"
      title={<span className="text-4xl kanji-font">{shown}</span>}
      description={`Details for the radical ${shown}`}
    >
      <RadicalDetailsBody radical={shown} onSelectForm={setShown} />
    </ScrollableDialogContent>
  );
};
