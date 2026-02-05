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
import { Badge } from "@/components/ui/badge";
import { outLinks } from "@/lib/external-links";
import { ExternalKanjiLinks } from "@/components/common/ExternalKanjiLinks";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";

const RirikkuCTABadge = () => {
  return (
    <Badge className="mb-3 rounded-md py-2 w-full">
      <a href={outLinks.ririkku} target="_blank" rel="noopener noreferrer">
        Lyrics make Japanese stick.{" "}
        <span className="underline">{"Ririkku,"}</span> the{" Internet's"}{" "}
        coolest music player™ helps you absorb real Japanese from songs you
        love.
      </a>
    </Badge>
  );
};

const ImprovementCTA = () => {
  return (
    <Badge className="mb-3 rounded-md py-2 w-full text-left block">
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
      <ImprovementCTA />
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
      <SimpleAccordion trigger={"Frequency Ranks"}>
        <FrequencyInfo freqRankInfo={data.frequency} />
      </SimpleAccordion>
      <SimpleAccordion trigger={"Reading Frequency Category"}>
        <ReadingFrequencyCategory kanji={kanji} />
      </SimpleAccordion>
      <SimpleAccordion trigger={"External Dictionaries"} defaultOpen={true}>
        <div className="text-left mt-2">
          <ExternalKanjiLinks kanji={kanji} />
        </div>
      </SimpleAccordion>
      <RirikkuCTABadge />
      <div className="w-full flex justify-start space-x-1">
        <LinksOutItems />
        <KanjiKeyboardShortcuts kanji={kanji} />
      </div>
    </div>
  );
};
