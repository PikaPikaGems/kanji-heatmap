import { lazy, Suspense } from "react";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { DefaultErrorFallback, ErrorBoundary } from "@/components/error";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { BasicLoading } from "@/components/common/BasicLoading";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { FrequencyInfo } from "./FrequencyInfo";
import { General } from "./General";
import { RequestForSuggestion } from "@/components/common/RequestForSuggestion";
import { KanjiKeyboardShortcuts } from "./KanjiKeyboardShortcuts";
import { Badge } from "@/components/ui/badge";
import { outLinks } from "@/lib/external-links";
import { ExternalKanjiLinks } from "@/components/common/ExternalKanjiLinks";

const RirikkuCTABadge = () => {
  return (
    <Badge className="mb-3 rounded-md py-2 w-full">
      <a href={outLinks.ririkku} target="_blank" rel="noopener noreferrer">
        👀 Look! Pick up Japanese words and grammar effortlessly while enjoying
        your favorite songs — with{" "}
        <span className="underline">
          {"Ririkku, the Internet's coolest music player ♫"}
        </span>
      </a>
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
      <RirikkuCTABadge />

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
      <SimpleAccordion trigger={"External Dictionaries"}>
        <div className="text-left mt-2">
          <ExternalKanjiLinks kanji={kanji} />
        </div>
      </SimpleAccordion>
      <RequestForSuggestion />
      <div className="w-full flex justify-start space-x-1">
        <LinksOutItems />
        <KanjiKeyboardShortcuts kanji={kanji} />
      </div>
    </div>
  );
};
