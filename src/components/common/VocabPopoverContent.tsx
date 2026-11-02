import { ReactNode, useState } from "react";
import { DottedSeparator } from "@/components/ui/dotted-separator";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { GlobalKanjiLink } from "@/components/dependent/routing/global-links";
import { VocabActions as WordActionIcons } from "@/components/common/VocabActions";
import { SeeMore as ExpandableGloss } from "@/components/common/SeeMore";
import { vocabExternalLinks } from "@/lib/external-links";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { isAiExplainReady } from "@/lib/ai-explain/preferences";
import { openWordExplain } from "@/lib/ai-explain/word-explain-dialog";
import { useCurrentOwner } from "@/lib/engine/content-owner";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/**
 * "✨ AI Explain" on its own line between the gloss and the action icons,
 * when AI study tools are set up.
 */
const WordAiExplain = ({ word }: { word: string }) => {
  const [settings] = useAiExplainSettings();
  const owner = useCurrentOwner();
  // Nobody's saved answers show until the owner is known.
  if (owner.status !== "known" || !isAiExplainReady(settings)) return null;
  return (
    <>
      <DottedSeparator />
      <div className="flex justify-center py-4">
        <button
          type="button"
          className={cn(cnDottedUnderlineTrigger, "text-xs text-foreground")}
          onClick={() => openWordExplain(word)}
        >
          ✨ AI Explain
        </button>
      </div>
    </>
  );
};

/** Each kanji in the word, as a link with its keyword. */
const WordKanjiLinks = ({
  wordKanjis,
}: {
  wordKanjis: VocabPopoverContentProps["wordKanjis"];
}) => {
  if (wordKanjis.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center p-1">
      {wordKanjis.map(({ kanji, keyword }) => (
        <GlobalKanjiLink kanji={kanji} keyword={keyword} key={kanji} />
      ))}
    </div>
  );
};

interface VocabPopoverContentProps {
  word: string;
  kana?: string;
  wordKanjis: { kanji: string; keyword: string }[];
  definition?: string;
  optionalSection?: ReactNode;
}

export const VocabPopoverContent = ({
  word,
  kana,
  wordKanjis,
  definition,
  optionalSection,
}: VocabPopoverContentProps) => {
  const [showAllLinks, setShowAllLinks] = useState(false);
  const maxLinks = 6;
  const canSeeAllLinks = vocabExternalLinks.length <= maxLinks;
  const visibleLinks =
    canSeeAllLinks || showAllLinks
      ? vocabExternalLinks
      : vocabExternalLinks.slice(0, maxLinks);

  return (
    <div className="p-2 w-72">
      <WordKanjiLinks wordKanjis={wordKanjis} />

      {(definition || optionalSection) && (
        <>
          <DottedSeparator />
          <div className="my-2">
            {optionalSection}
            {definition && (
              <>
                <ExpandableGloss
                  definition={`${kana ?? ""} ${kana ? "・" : ""} ${definition}`}
                  maxLen={120}
                />
              </>
            )}
          </div>
        </>
      )}
      <WordAiExplain word={word} />
      <DottedSeparator />
      <WordActionIcons kana={kana ?? ""} word={word} />

      <div className="flex flex-wrap justify-center pt-2 text-xs font-bold">
        🧐 Explore {word} in the wild ↓
      </div>
      <div className="flex flex-wrap justify-center px-2 pb-2 text-xs">
        {visibleLinks.map((item) => (
          <ExternalTextLink
            key={item.name}
            href={item.url(word)}
            text={item.name}
          />
        ))}
        {!canSeeAllLinks && (
          <button
            className="px-1 py-1 mx-1 font-bold underline rounded-lg hover:bg-neon-accent hover:text-black"
            onClick={() => {
              setShowAllLinks((prev) => !prev);
            }}
          >
            {showAllLinks ? <>See less</> : <>See more</>}
          </button>
        )}
      </div>
    </div>
  );
};
