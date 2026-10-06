import { useState } from "react";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { BadgeWithPopover } from "@/components/common/BadgeWithPopover";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { Badge } from "@/components/ui/badge";
import { DottedSeparator } from "@/components/ui/dotted-separator";
import { JLPTListItems, JLTPTtypes } from "@/lib/jlpt";
import { outLinks } from "@/lib/external-links";
import { cn } from "@/lib/utils";
import {
  CommonWordEntry,
  FreqCategoryMap,
  getBookTags,
} from "@/lib/sample-vocabulary";

// Leveled word lists, shown in the word-list popover as more basic → more advanced.
const BOOK_LEVEL_RANGES = [
  ["🥚 Core 1", "🐥 Core 3"],
  ["Shin N4", "Shin N1"],
  ["🌕 K Lvl 1", "🌑 K Lvl 5"],
];

type WordTag =
  | { kind: "kaishi" }
  | { kind: "jlpt"; jlpt: JLTPTtypes }
  | { kind: "tier"; tier: string; label: string }
  | { kind: "book"; id: string; label: string; jlpt?: JLTPTtypes }
  | { kind: "variant" };

/** Tags in display priority: variant, JLPT, Kaishi, frequency tier, word lists. */
const getWordTags = (entry: CommonWordEntry): WordTag[] => {
  const tags: WordTag[] = [];
  if (
    entry.uncommon_form ||
    entry.uncommon_spelling ||
    entry.uk ||
    entry.alt_of
  ) {
    tags.push({ kind: "variant" });
  }

  const jlptNum = entry.j ? Number(entry.j) : -1;
  if ([1, 2, 3, 4, 5].includes(jlptNum)) {
    tags.push({ kind: "jlpt", jlpt: `n${jlptNum}` as JLTPTtypes });
  }

  if (entry.k === true || entry.k === 1) tags.push({ kind: "kaishi" });

  const tierLabel = entry.t ? FreqCategoryMap[entry.t] : undefined;
  if (entry.t && tierLabel) {
    tags.push({ kind: "tier", tier: entry.t, label: tierLabel });
  }

  getBookTags(entry).forEach((tag) => tags.push({ kind: "book", ...tag }));
  return tags;
};

const WordTagBadge = ({ tag }: { tag: WordTag }) => {
  switch (tag.kind) {
    case "kaishi":
      return (
        <BadgeWithPopover
          name="✓ Kaishi 1.5k"
          desc="This word is included in Kaishi 1.5k - a free, modern, modular Japanese Anki deck for beginners"
        />
      );
    case "jlpt":
      return <JLPTBadge jlpt={tag.jlpt} />;
    case "tier":
      return (
        <Badge className="px-2 m-1 whitespace-nowrap" variant="outline">
          {tag.tier} {tag.label}
        </Badge>
      );
    case "book":
      return (
        <BadgeWithPopover
          name={
            tag.jlpt ? (
              <span className="inline-flex items-center">
                <span
                  className={`h-2 w-2 block ${JLPTListItems[tag.jlpt].cn} !rounded-full mr-1`}
                />
                {tag.label}
              </span>
            ) : (
              tag.label
            )
          }
          desc={
            <>
              These word lists are community-maintained and may differ from the
              official editions.{" "}
              <ExternalTextLink
                href={outLinks.githubContentIssue}
                text="Suggest an edit."
              />
              <DottedSeparator className="my-2" />
              <p className="mb-1 font-bold">
                Levels: more basic → more advanced
              </p>
              <ul className="space-y-0.5">
                {BOOK_LEVEL_RANGES.map(([from, to]) => (
                  <li key={from}>
                    {from} → {to}
                  </li>
                ))}
              </ul>
            </>
          }
        />
      );
    case "variant":
      return (
        <BadgeWithPopover
          name="⚠️ Variant"
          desc="This word might not be usually written or read this way"
        />
      );
  }
};

const tagKey = (tag: WordTag) => (tag.kind === "book" ? tag.id : tag.kind);

/** Shows the top tags of a word; the rest are revealed by a "..." badge. */
export const WordTagBadges = ({
  entry,
  showEmptyState = false,
  maxVisible = 3,
  className,
}: {
  entry: CommonWordEntry;
  showEmptyState?: boolean;
  maxVisible?: number;
  className?: string;
}) => {
  const [showAll, setShowAll] = useState(false);
  const tags = getWordTags(entry);

  if (tags.length === 0) {
    return showEmptyState ? <>-</> : null;
  }

  const visibleTags = showAll ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - visibleTags.length;

  return (
    <div className={cn("flex flex-wrap items-center", className)}>
      {visibleTags.map((tag) => (
        <WordTagBadge key={tagKey(tag)} tag={tag} />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          aria-label={`Show ${hiddenCount} more ${hiddenCount === 1 ? "tag" : "tags"}`}
          onClick={() => setShowAll(true)}
        >
          <Badge
            variant="outline"
            className="px-3 m-1 cursor-pointer hover:bg-neon-accent hover:text-black"
          >
            ...
          </Badge>
        </button>
      )}
    </div>
  );
};
