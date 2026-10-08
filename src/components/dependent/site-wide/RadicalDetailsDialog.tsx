import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { GenericPopover } from "@/components/common/GenericPopover";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GlobalKanjiLink } from "@/components/dependent/routing/global-links";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import type { RadicalPopoverDetails, RadicalPopoverText } from "@/lib/radicals";

const sectionHeadingCn =
  "mb-2 border-b-2 border-dotted text-xs font-extrabold uppercase tracking-widest text-muted-foreground text-left";

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

/** An example kanji; tapping it offers the link to its kanji page. */
const ExampleKanji = ({ kanji }: { kanji: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  return (
    <GenericPopover
      trigger={
        <button
          type="button"
          className="p-1 text-3xl leading-none border-2 border-dotted shrink-0 kanji-font rounded-xl hover:border-solid hover:border-neon-accent"
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

/**
 * The radical's details, opened from the radical popover: the reasons
 * behind its names, the meaning and sound examples, and the references.
 * Example kanji open a kanji link, words open the vocab popover, and
 * readings are kana badges, as elsewhere in the app.
 */
export const RadicalDetailsDialogContent = ({
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
            🔊 Phonetic: {text.sounds.join("・")}
          </h3>
          <ul className="space-y-2">
            {text.sound?.map((example) => (
              <li key={example.kanji} className="flex items-center gap-3">
                <ExampleKanji kanji={example.kanji} />
                <ExampleWordPopover
                  word={example.word}
                  readingOverride={example.reading}
                  wordTranslationOverride={example.gloss}
                  className="px-2 py-1 text-xl"
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
      <section>
        <h3 className={sectionHeadingCn}>Sources</h3>
        <RadicalSources text={text} />
      </section>
    </div>
  </ScrollableDialogContent>
);
