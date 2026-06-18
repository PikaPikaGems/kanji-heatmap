import { lazy, ReactNode, Suspense } from "react";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { ErrorBoundary } from "@/components/error";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { BasicLoading } from "@/components/common/BasicLoading";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { FrequencyInfo } from "./FrequencyInfo";
import { General } from "./General";
import { KanjiKeyboardShortcuts } from "./KanjiKeyboardShortcuts";
import { ReadingFrequencyCategory } from "./ReadingFrequencyCategory";
import { SampleVocabulary, TextbookVocabulary } from "./SampleVocabulary";
import { Badge } from "@/components/ui/badge";
import { outLinks } from "@/lib/external-links";
import { ExternalKanjiLinks } from "@/components/common/ExternalKanjiLinks";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { ModeToggle } from "@/components/dependent/site-wide/ModeToggle";
import { StructureInfo } from "./StructureInfo";
import { RepresentativeStudyWord } from "./RepresentativeStudyWord";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";
import { DotIcon } from "@/components/icons";
import { DebugInfo } from "@/components/common/DebugInfo";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import { useKanjiRepresentativeWord } from "@/providers/kanji-representative-word-provider";


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

export const KanjiDetailsBottom = ({ kanji }: { kanji: string }) => {
  return <>

    <p className="my-4 text-xs text-left">
      <strong>⚠ Note:</strong> The speak buttons 🔊 🎧 rely on your {"browser's"} built-in text-to-speech, which may not work in some devices.
    </p>

    <div className="my-4 w-fit">
      <PikaPikaLinks />
    </div>

    <div className="flex items-center justify-start w-full mt-4 mb-8 space-x-1">
      <LinksOutItems />
      <DotIcon className="w-2 m-0" />
      <DebugInfo />
      <RefreshPageBtn />
      <KanjiKeyboardShortcuts kanji={kanji} />
      <ModeToggle />
    </div>
  </>
}
const StrokeAnimation = lazy(() => import("./StrokeAnimation"));

const RepresentativeStudyWordAccordion = ({ kanji }: { kanji: string }) => {

  const info = useKanjiRepresentativeWord(kanji)

  return <>
    <SimpleAccordion trigger={`${kanji} Study Word ${info?.word ? `~ ${info?.word}` : ""}`} defaultOpen={info?.word != null}>
      <RepresentativeStudyWord kanji={kanji} />
    </SimpleAccordion >
  </>

}

export const KanjiDetails = ({ kanji, smallScreenNode }: { kanji: string, smallScreenNode: ReactNode }) => {
  const getInfo = useGetKanjiInfoFn();

  if (getInfo == null) {
    return <BasicLoading />;
  }

  const data = getInfo(kanji);

  return (
    <div className="py-2 mx-2">
      <div className="relative p-0 m-0 md:hidden">
        <SimpleAccordion trigger={`${kanji} Reference Card`} defaultOpen={true}>
          {smallScreenNode}
        </SimpleAccordion>
      </div>
      <SimpleAccordion trigger={"General Information"} defaultOpen={true}>
        <General kanji={kanji} />
      </SimpleAccordion>
      <RepresentativeStudyWordAccordion kanji={kanji} />
      <SimpleAccordion trigger={`Stroke Order`}>
        <ErrorBoundary details="StrokeAnimation in KanjiDetails">
          <Suspense fallback={<BasicLoading />}>
            <StrokeAnimation kanji={kanji} />
          </Suspense>
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={`Selected Words Starting with ${kanji}`}>
        <ErrorBoundary details="SampleVocabulary in KanjiDetails">
          <SampleVocabulary kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={`Textbook Vocabulary Containing ${kanji}`}>
        <ErrorBoundary details="TextbookVocabulary in KanjiDetails">
          <TextbookVocabulary kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={"Character Structure"}>
        <ErrorBoundary details="StructuralComposition in KanjiDetails">
          <StructureInfo kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={"Frequency Ranks"}>
        <FrequencyInfo freqRankInfo={data?.frequency} kanji={kanji} />
      </SimpleAccordion>
      <SimpleAccordion trigger={"Reading Usefulness"}>
        <ErrorBoundary details="ReadingFrequencyCategory in KanjiDetails">
          <ReadingFrequencyCategory kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={`External Links for ${kanji}`} defaultOpen={true}>
        <div className="mt-2 text-left">
          <ExternalKanjiLinks kanji={kanji} />
        </div>
      </SimpleAccordion>
      <KanjiDetailsBottom kanji={kanji} />
    </div>
  );
};
