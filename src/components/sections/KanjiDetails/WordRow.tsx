import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { JishoBtn } from "@/components/common/JishoBtn";
import { JotobaBtn } from "@/components/common/JotobaBtn";
import { KanjiApiBtn } from "@/components/common/KanjiApiBtn";
import { BugIconErrorBoundary } from "@/components/error";
import { CommonWordEntry, splitList } from "@/lib/sample-vocabulary";
import { WordTagBadges } from "./WordTagBadges";

const TRANSLATION_MAX_LEN = 60;

/** Long translations are cut to "<text>..." and expand on click. */
const Translation = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= TRANSLATION_MAX_LEN) {
    return <span className="text-xs font-bold">{text}</span>;
  }

  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      className="px-1 text-xs font-bold text-center rounded-md cursor-pointer hover:bg-neon-accent hover:text-black"
      onClick={() => setIsExpanded((prev) => !prev)}
    >
      {isExpanded ? text : `${text.slice(0, TRANSLATION_MAX_LEN).trimEnd()}...`}
    </button>
  );
};

export const WordRow = ({ entry }: { entry: CommonWordEntry }) => {
  const readings = splitList(entry.r);

  return (
    <>
      <TableRow className="animate-fade-in">
        <TableCell className="w-12">
          <SpeakButton iconType="headphones" word={entry.w} />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit">
          <ExampleWordPopover
            word={entry.w}
            readingOverride={
              readings.length > 0 ? readings.join(" ・ ") : undefined
            }
            wordTranslationOverride={entry.e}
            optionalSection={
              <WordTagBadges
                entry={entry}
                maxVisible={2}
                className="justify-center"
              />
            }
          />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit">
          {readings.length > 0 ? (
            <div className="flex flex-wrap justify-center mx-auto min-w-48 max-w-80">
              {readings.map((r) => (
                <RomajiBadge key={r} kana={r} />
              ))}
            </div>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="text-center">
          <div className="w-48 mx-auto">
            {entry.e && entry.e !== "-" ? <Translation text={entry.e} /> : "-"}
          </div>
        </TableCell>
        <TableCell className="gap-2 px-4 text-sm text-center text-muted-foreground">
          <div className="w-48 mx-auto">
            <WordTagBadges
              entry={entry}
              className="justify-center"
              showEmptyState
            />
          </div>
        </TableCell>
        <TableCell className="w-12">
          <BugIconErrorBoundary>
            <JotobaBtn word={entry.w} />
          </BugIconErrorBoundary>
        </TableCell>
        <TableCell className="w-12">
          <BugIconErrorBoundary>
            <KanjiApiBtn word={entry.w} />
          </BugIconErrorBoundary>
        </TableCell>
        <TableCell className="w-12">
          <BugIconErrorBoundary>
            <JishoBtn word={entry.w} />
          </BugIconErrorBoundary>
        </TableCell>
      </TableRow>
    </>
  );
};
