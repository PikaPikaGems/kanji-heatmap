import { SectionLoading } from "@/components/common/SectionLoading";
import { useKanjiRepresentativeWordDetails } from "@/providers/kanji-representative-word-hooks";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
import { FreqTagBadges } from "@/components/common/FreqTagBadges";
import {
  vocabExternalLinks,
  vocabExternalLinksCore,
} from "@/lib/external-links";
import { InfoIcon } from "lucide-react";
import { Table, TableBody, TableRow } from "@/components/ui/table";
import { LabelCell, TableCellGrow } from "./General";
import { cnDottedUnderlineTrigger } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

import { VocabActions } from "@/components/common/VocabActions";
import { lazy, Suspense, useState, type ReactNode } from "react";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { isAiExplainReady } from "@/lib/ai-explain/preferences";
import { useCurrentOwner } from "@/lib/engine/content-owner";

const AnchorWordDetails = lazy(() => import("./AiContent/AnchorWordDetails"));

const vocabExternalLinksMore = vocabExternalLinks.slice(
  vocabExternalLinksCore.length
);

const AnchorWordLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={cn(
      "inline-flex items-center px-3 py-1 text-xs transition-colors border border-dashed rounded-full border-foreground/30 hover:bg-accent hover:text-accent-foreground",
      className
    )}
  >
    {children}
  </a>
);

/**
 * The core dictionary links, then "· · ·" that reveals the rest (the ones
 * the vocab popover lists under "Explore in the wild").
 */
const AnchorWordLinks = ({ word }: { word: string }) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      {vocabExternalLinksCore.map(({ name, url }) => (
        <AnchorWordLink key={name} href={url(word)}>
          {name}
        </AnchorWordLink>
      ))}
      {showMore ? (
        vocabExternalLinksMore.map(({ name, url }) => (
          <AnchorWordLink
            key={name}
            href={url(word)}
            className="animate-fade-in-fast"
          >
            {name}
          </AnchorWordLink>
        ))
      ) : (
        <button
          type="button"
          aria-label={`See more links for ${word}`}
          onClick={() => setShowMore(true)}
          className="inline-flex items-center px-3 py-1 text-xs font-bold tracking-widest transition-colors border border-dashed rounded-full border-foreground/30 hover:bg-accent hover:text-accent-foreground"
        >
          · · ·
        </button>
      )}
    </div>
  );
};

const ViewVocabDetails = () => (
  <GenericPopover
    trigger={
      <button className="flex p-1 text-base tracking-widest underline uppercase hover:text-foreground text-muted-foreground decoration-dashed underline-offset-8">
        View Vocabulary Details
      </button>
    }
    content={<div className="p-3 text-sm">Coming soon!</div>}
  />
);

const WhatIsARepresentativeStudyWord = () => {
  return (
    <>
      <GenericPopover
        trigger={
          <span className={cnDottedUnderlineTrigger}>
            <strong>What is an Anchor Word? (Experimental Feature)</strong>
            <InfoIcon size={14} />
          </span>
        }
        content={
          <div className="p-4 text-xs text-left w-72">
            <p className="py-2">
              An <strong>Anchor Word</strong> is a Japanese word chosen to
              create a strong, memorable connection between a kanji and one of
              its vocabulary words. Each of the ~2,000 kanji in Kanji Heatmap
              has one unique Anchor Word.
            </p>
            <p className="py-2">
              Anchor Words are selected by {`Kanji Heatmap's`} algorithm, which
              is still experimental and being refined. As the algorithm
              improves, Anchor Words may change over time.
            </p>
          </div>
        }
      />
    </>
  );
};

export const RepresentativeStudyWord = ({ kanji }: { kanji: string }) => {
  const data = useKanjiRepresentativeWordDetails(kanji);
  const [aiSettings] = useAiExplainSettings();
  const owner = useCurrentOwner();

  if (!data) {
    return (
      <div className="w-full p-4 text-base text-center">
        No Anchor Word available for {kanji}.
      </div>
    );
  }

  const { word, reading, englishGloss, tags } = data;

  const rows: { label: string; description: string; content: ReactNode }[] = [
    {
      label: "Word",
      description:
        "This kanji's Anchor Word. Tap it for its kanji, meaning and more links.",
      content: (
        <ExampleWordPopover
          word={word}
          wordTranslationOverride={englishGloss}
          readingOverride={reading}
          className="text-4xl"
        />
      ),
    },
    {
      label: "Readings",
      description: "How the word is read.",
      content: reading
        .split("・")
        .map((r) => <RomajiBadge key={r} kana={r} className="text-lg" />),
    },
    {
      label: "Tags",
      description: "How common the word is, by the word lists it is in.",
      content: tags.length > 0 ? <FreqTagBadges tags={tags} /> : null,
    },
    {
      label: "Gloss",
      description: "A short English meaning of the word.",
      content: <span className="text-sm font-bold">{englishGloss}</span>,
    },
    {
      label: "Actions",
      description: "Hear, copy or share the word.",
      content: <VocabActions word={word} kana={reading} />,
    },
    {
      label: "Links",
      description: `Look up ${word} in dictionaries and see it used in the wild.`,
      content: <AnchorWordLinks word={word} />,
    },
  ];

  return (
    <div className="py-3 space-y-3 text-left">
      <Table className="table-fixed">
        <TableBody>
          {rows.map(({ label, description, content }) => (
            <TableRow key={label} className="text-left">
              <LabelCell label={label} description={description} />
              <TableCellGrow>
                {content == null ? (
                  <div> - </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1">
                    {content}
                  </div>
                )}
              </TableCellGrow>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {owner.status === "known" && !isAiExplainReady(aiSettings) && (
        <div className="flex flex-wrap items-center gap-1 pt-2">
          <ViewVocabDetails />
        </div>
      )}
      {isAiExplainReady(aiSettings) && (
        <Suspense fallback={<SectionLoading label="Loading AI controls" />}>
          <AnchorWordDetails
            word={word}
            reading={reading}
            englishGloss={englishGloss}
          />
        </Suspense>
      )}
      <div className="pt-16 pl-2 text-left">
        <WhatIsARepresentativeStudyWord />
      </div>
    </div>
  );
};
