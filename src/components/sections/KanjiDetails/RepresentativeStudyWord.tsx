import { SectionLoading } from "@/components/common/SectionLoading";
import { useKanjiAnchorWords } from "@/providers/kanji-representative-word-hooks";
import { ANCHOR_TIER_LABELS, type AnchorWord } from "@/lib/kanji/anchor-words";
import type { CommonWordEntry } from "@/lib/sample-vocabulary";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabsList } from "@/components/ui/segmented-tabs";
import { Tabs } from "@/components/ui/tabs";
import { AnchorWordFrequencyRanks } from "./AnchorWordFrequencyRanks";
import { WordTagBadges } from "./WordTagBadges";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { GenericPopover } from "@/components/common/GenericPopover";
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
              its vocabulary words. Each kanji in Kanji Heatmap has a main
              Anchor Word, and many also have a secondary one, usually with
              another reading of the kanji. No word is used by two kanji.
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

const JLPT_TAGS = ["n5", "n4", "n3", "n2", "n1"];

/** The word's tags as a word-list entry, so they show like other words' badges. */
const toWordEntry = ({ word, tags }: AnchorWord): CommonWordEntry => {
  const jlpt = tags.find((tag) => JLPT_TAGS.includes(tag));
  return {
    w: word,
    j: jlpt ? Number(jlpt.slice(1)) : undefined,
    k: tags.includes("kaishi"),
    o: tags.join(","),
  };
};

/**
 * One anchor word's table, then its frequency ranks, then View Vocabulary
 * Details (or the AI controls).
 */
const AnchorWordPanel = ({ anchor }: { anchor: AnchorWord }) => {
  const [aiSettings] = useAiExplainSettings();
  const owner = useCurrentOwner();
  const { word, readings, englishGloss, tier, tags, ranks } = anchor;
  const reading = readings.join("・");

  const rows: { label: string; description: string; content: ReactNode }[] = [
    {
      label: "Word",
      description:
        "This Anchor Word. Tap it for its kanji, meaning and more links.",
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
      content: readings.map((r) => (
        <RomajiBadge key={r} kana={r} className="text-lg" />
      )),
    },
    {
      label: "Gloss",
      description: "A short English meaning of the word.",
      content: <span className="text-sm font-bold">{englishGloss}</span>,
    },
    {
      label: "Tags",
      description: "Its JLPT level and the word lists it is in.",
      content:
        tags.length > 0 ? (
          <WordTagBadges
            entry={toWordEntry(anchor)}
            isName={tags.includes("name")}
            maxVisible={Infinity}
            className="-m-1"
          />
        ) : null,
    },
    {
      label: "Tier",
      description: "How common the word is, across the frequency lists below.",
      content: tier ? (
        <Badge className="px-2 m-1 whitespace-nowrap" variant="outline">
          {tier} {ANCHOR_TIER_LABELS[tier] ?? ""}
        </Badge>
      ) : null,
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
    <div className="space-y-3">
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

      <AnchorWordFrequencyRanks word={word} ranks={ranks} />
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
    </div>
  );
};

type AnchorTab = "main" | "secondary";

/**
 * The kanji's anchor words: one panel, or Main / Secondary tabs when it has
 * a secondary word.
 */
export const RepresentativeStudyWord = ({ kanji }: { kanji: string }) => {
  const anchors = useKanjiAnchorWords(kanji);
  const [tab, setTab] = useState<AnchorTab>("main");

  if (!anchors) {
    return (
      <div className="w-full p-4 text-base text-center">
        No Anchor Word available for {kanji}.
      </div>
    );
  }

  const { main, secondary } = anchors;
  // Arrowing to a kanji without a secondary word falls back to the main one.
  const shown: AnchorTab = secondary ? tab : "main";

  return (
    <div className="py-3 space-y-3 text-left">
      {secondary ? (
        <Tabs
          value={shown}
          onValueChange={(value) => setTab(value as AnchorTab)}
        >
          <div className="flex justify-start px-2">
            <SegmentedTabsList
              value={shown}
              label="Anchor words"
              options={[
                {
                  value: "main",
                  label: <TabLabel name="Main" word={main.word} />,
                },
                {
                  value: "secondary",
                  label: <TabLabel name="Secondary" word={secondary.word} />,
                },
              ]}
            />
          </div>
          <div key={shown} className="pt-2 animate-fade-in-fast">
            <AnchorWordPanel anchor={shown === "main" ? main : secondary} />
          </div>
        </Tabs>
      ) : (
        <AnchorWordPanel anchor={main} />
      )}
      <div className="pt-16 pl-2 text-left">
        <WhatIsARepresentativeStudyWord />
      </div>
    </div>
  );
};

const TabLabel = ({ name, word }: { name: string; word: string }) => (
  <span className="whitespace-nowrap">
    {name} · <span className="kanji-font">{word}</span>
  </span>
);
