import { TableCell, TableRow } from "@/components/ui/table";
import { ExampleWordPopover } from "@/components/common/ExampleWordPopover";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { JLTPTtypes } from "@/lib/jlpt";
import { BadgeWithPopover } from "@/components/common/BadgeWithPopover";
import { Badge } from "@/components/ui/badge";
import { JishoBtn } from "@/components/common/JishoBtn";
import { JotobaBtn } from "@/components/common/JotobaBtn";
import { BugIconErrorBoundary } from "@/components/error";
import { CommonWordEntry, FreqCategoryMap } from "@/lib/sample-vocabulary";

const WordTagBadges = ({
  jlpt,
  isKaishi,
  tier,
  isUncommonForm,
  showEmptyState = false,
  breakAfterJlpt = false,
}: {
  jlpt: JLTPTtypes | null;
  isKaishi: boolean;
  tier?: string;
  isUncommonForm?: boolean;
  showEmptyState?: boolean;
  breakAfterJlpt?: boolean;
}) => {
  const freqLabel = tier ? FreqCategoryMap[tier] : undefined;
  const hasAnyTag = jlpt || isKaishi || freqLabel || isUncommonForm;

  return (
    <>
      {jlpt && (
        <>
          {<JLPTBadge jlpt={jlpt} />}
          {breakAfterJlpt && <br />}
        </>
      )}
      {isKaishi && (
        <BadgeWithPopover
          name="✓ Kaishi 1.5k"
          desc="This word is included in Kaishi 1.5k - a free, modern, modular Japanese Anki deck for beginners"
        />
      )}
      {freqLabel && (
        <Badge className="px-2 m-1 whitespace-nowrap" variant="outline">
          {tier} {freqLabel}
        </Badge>
      )}
      {isUncommonForm && (
        <BadgeWithPopover
          name="⚠️ Variant"
          desc="This word might not be usually written or read this way"
        />
      )}
      {showEmptyState && !hasAnyTag && "-"}
    </>
  );
};

export const WordRow = ({ entry }: { entry: CommonWordEntry }) => {
  const jlptNum = entry.j ? Number(entry.j) : -1;
  const jlpt = [1, 2, 3, 4, 5].includes(jlptNum)
    ? (`n${jlptNum}` as JLTPTtypes)
    : null;
  const isKaishi = entry.k === true || entry.k === 1;
  const tier = entry.t && FreqCategoryMap[entry.t] ? entry.t : undefined;

  return (
    <>
      <TableRow className="animate-fade-in">
        <TableCell className="w-12">
          <SpeakButton iconType="headphones" word={entry.w} />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit">
          <ExampleWordPopover
            word={entry.w}
            readingOverride={entry.r}
            wordTranslationOverride={entry.e}
            optionalSection={
              <WordTagBadges
                jlpt={jlpt}
                isKaishi={isKaishi}
                tier={tier}
                isUncommonForm={entry.uncommon_form}
              />
            }
          />
        </TableCell>
        <TableCell className="text-base kanji-font w-fit whitespace-nowrap">
          {entry.r && entry.r !== "-" ? (
            <>
              {" "}
              {entry.r.split(",").map((r) => {
                return <RomajiBadge key={r} kana={r} />;
              })}
            </>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="w-fit max-w-24">
          {entry.e && entry.e !== "-" ? (
            <span className="text-xs font-bold">{entry.e}</span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="gap-2 px-4 text-sm text-muted-foreground max-w-36">
          <WordTagBadges
            jlpt={jlpt}
            isKaishi={isKaishi}
            tier={tier}
            isUncommonForm={entry.uncommon_form}
            showEmptyState
            breakAfterJlpt
          />
        </TableCell>
        <TableCell className="w-12">
          <BugIconErrorBoundary>
            <JishoBtn word={entry.w} />
          </BugIconErrorBoundary>
        </TableCell>
        <TableCell className="w-12">
          <BugIconErrorBoundary>
            <JotobaBtn word={entry.w} />
          </BugIconErrorBoundary>
        </TableCell>
      </TableRow>
    </>
  );
};
