import { lazy, Suspense } from "react";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { DefaultErrorFallback, ErrorBoundary } from "@/components/error";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { BasicLoading } from "@/components/common/BasicLoading";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { FrequencyInfo } from "./FrequencyInfo";
import { General } from "./General";
import { KanjiKeyboardShortcuts } from "./KanjiKeyboardShortcuts";
import { ReadingFrequencyCategory } from "./ReadingFrequencyCategory";
import { SampleVocabulary } from "./SampleVocabulary";
import { Badge } from "@/components/ui/badge";
import { outLinks } from "@/lib/external-links";
import { ExternalKanjiLinks } from "@/components/common/ExternalKanjiLinks";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { ModeToggle } from "@/components/dependent/site-wide/ModeToggle";
import { StructureInfo } from "./StructureInfo";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";

const SHOW_SAMPLE_VOCAB_SECTION = true;
export const RirikkuCTABadge = () => {
  return (
    <Badge className="w-full py-2 mb-3 rounded-md">
      <a href={outLinks.ririkku} target="_blank" rel="noopener noreferrer">
        Lyrics make Japanese stick.{" "}
        <span className="underline">{"Ririkku,"}</span> the{" Internet's"}{" "}
        coolest music player™ helps you absorb real Japanese from memorable songs.
      </a>
    </Badge>
  );
};

export const ImprovementCTA = () => {
  return (
    <Badge className="block w-full py-2 mb-3 text-left rounded-md">
      We strive to make our content as accurate and helpful as possible. If you
      notice an error or think the sample vocabulary or English keywords for
      this kanji could be better, please let us know on{" "}
      <ExternalTextLink href={outLinks.githubContentIssue} text="GitHub," />{" "}
      <ExternalTextLink href={outLinks.twitter} text="X/Twitter," /> or{" "}
      <ExternalTextLink href={outLinks.discord} text="Discord." /> Your feedback
      means a lot!
    </Badge>
  );
};
const StrokeAnimation = lazy(() => import("./StrokeAnimation"));

export const KanjiDetails = ({ kanji }: { kanji: string }) => {
  const getInfo = useGetKanjiInfoFn();

  if (getInfo == null) {
    return <BasicLoading />;
  }

  const data = getInfo(kanji);

  if (data == null) {
    return <DefaultErrorFallback message="Failed to load data." />;
  }

  return (
    <div className="py-2 mx-2">
      <SimpleAccordion trigger={"General"} defaultOpen={true}>
        <General kanji={kanji} />
      </SimpleAccordion>
      <SimpleAccordion trigger={"Stroke Order Animation"}>
        <ErrorBoundary details="StrokeAnimation in KanjiDetails">
          <Suspense fallback={<BasicLoading />}>
            <StrokeAnimation kanji={kanji} />
          </Suspense>
        </ErrorBoundary>
      </SimpleAccordion>
      {SHOW_SAMPLE_VOCAB_SECTION &&
        <SimpleAccordion trigger={"Sample Vocabulary"}>
          <ErrorBoundary details="SampleVocabulary in KanjiDetails">
            <SampleVocabulary kanji={kanji} />
          </ErrorBoundary>
        </SimpleAccordion>
      }
      <SimpleAccordion trigger={"Structural Composition"}>
        <ErrorBoundary details="StructuralComposition in KanjiDetails">
          <StructureInfo kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={"Frequency Ranks"}>
        <FrequencyInfo freqRankInfo={data.frequency} />
      </SimpleAccordion>
      <SimpleAccordion trigger={"Reading Usefulness"}>
        <ErrorBoundary details="ReadingFrequencyCategory in KanjiDetails">
          <ReadingFrequencyCategory kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={"External Dictionaries"} defaultOpen={true}>
        <div className="mt-2 text-left">
          <ExternalKanjiLinks kanji={kanji} />
        </div>
      </SimpleAccordion>
      <div className="flex justify-start w-full mt-4 space-x-1">
        <LinksOutItems />
        <KanjiKeyboardShortcuts kanji={kanji} />
        <ModeToggle />
      </div>
      <div className="mt-4 w-fit">
        <PikaPikaLinks />
      </div>
    </div>
  );
};
