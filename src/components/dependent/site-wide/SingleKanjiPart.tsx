import { GenericPopover } from "@/components/common/GenericPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import {
  FakeComponentLink,
  ComponentPopoverContent,
  RadicalPopoverContent,
} from "../routing/global-links";
import {
  useGetKanjiInfoFn,
  useRadicals,
} from "@/kanji-worker/kanji-worker-hooks";
import { isKnownRadical } from "@/lib/radicals";
import { useComponentSearchEntry } from "@/components/sections/KanjiDetails/use-component-search-entry";

export const SingleKanjiPart = ({
  kanji,
  keyword,
  phonetics = [],
  isKanji,
}: {
  kanji: string;
  keyword?: string;
  phonetics?: string[];
  isKanji: boolean;
}) => {
  const radicals = useRadicals();
  const getKanjiInfo = useGetKanjiInfoFn();
  const componentEntry = useComponentSearchEntry(kanji);
  const componentKeyword = keyword ?? getKanjiInfo?.(kanji)?.keyword;
  const canOpenPopover =
    isKnownRadical(kanji, radicals) || componentEntry != null;

  const content = (
    <div className="p-2 text-xs font-bold">
      {/* The reading is the family's, not necessarily this kanji's: 門
              is もん, but kanji with 門 (間 簡 閑) are read かん. */}
      {phonetics.length > 0 && (
        // Text first, readings below: up to four readings (各) wrap inside
        // the box instead of stretching the whole popover.
        <div className="px-2 py-1.5 mx-auto mb-2 text-left border max-w-64 rounded-xl border-lime-400/40 bg-lime-400/5">
          <p className="font-normal leading-snug text-center whitespace-normal text-muted-foreground">
            Sound hint for kanji with{" "}
            <span className="kanji-font">{kanji}</span>:
          </p>
          <div className="flex flex-wrap justify-center">
            {phonetics.map((phonetic) => (
              <RomajiBadge
                key={phonetic}
                kana={phonetic}
                className="m-0.5 px-2 py-0.5 sm:py-0.5 text-base sm:text-base"
              />
            ))}
          </div>
        </div>
      )}

      {/* A radical opens the radical popover even when it is also a
              kanji (夕); the popover links to the kanji. */}
      {isKnownRadical(kanji, radicals) ? (
        <RadicalPopoverContent radical={kanji} />
      ) : componentEntry ? (
        <ComponentPopoverContent
          component={kanji}
          keyword={componentKeyword}
          isKanji={isKanji}
        />
      ) : (
        <>
          <FakeComponentLink radical={kanji} keyword={componentKeyword} />
          <span className="italic font-normal">{"(Component)"}</span>
        </>
      )}
    </div>
  );

  const triggerClassName = `flex flex-col my-1 kanji-font text-3xl border-2 rounded-2xl p-2 ${canOpenPopover ? "hover:border-solid hover:border-neon-accent" : "cursor-default"} ${phonetics.length > 0 ? " border-lime-400" : "border-dotted"}`;

  if (!canOpenPopover) {
    return <div className={triggerClassName}>{kanji}</div>;
  }

  return (
    <GenericPopover
      modal
      trigger={
        <button type="button" className={triggerClassName}>
          {kanji}
        </button>
      }
      content={content}
    />
  );
};
