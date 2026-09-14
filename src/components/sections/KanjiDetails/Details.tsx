import { lazy, ReactNode, Suspense } from "react";
import { Bug, Loader2, Volume2 } from "lucide-react";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { ErrorBoundary } from "@/components/error";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { BasicLoading } from "@/components/common/BasicLoading";
import { FrequencyInfo } from "./FrequencyInfo";
import { General } from "./General";
import { KanjiKeyboardShortcuts } from "./KanjiKeyboardShortcuts";
import { ReadingFrequencyCategory } from "./ReadingFrequencyCategory";
import { SampleVocabulary } from "./SampleVocabulary";
import { TextbookVocabulary } from "./TextbookVocabulary";
import { Badge } from "@/components/ui/badge";
import { outLinks } from "@/lib/external-links";
import { ExternalKanjiLinks } from "@/components/common/ExternalKanjiLinks";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { StructureInfo } from "./StructureInfo";
import { RepresentativeStudyWord } from "./RepresentativeStudyWord";
import { BottomBar } from "@/components/common/BottomBar";
import { useKanjiRepresentativeWordDetails } from "@/providers/kanji-representative-word-hooks";
import { KanjiWordStatusActions } from "./KanjiWordStatusActions";
import { StrokeAnimationLoadingScreen } from "./StrokeAnimationLoadingScreen";
import { InstallAppModal } from "@/components/common/InstallAppModal";

const StudyNotesLoadingFallback = () => (
  <div
    className="flex items-center justify-center w-full h-48"
    role="status"
    aria-label="Loading"
  >
    <Loader2 className="size-7 animate-spin" />
  </div>
);

export const RirikkuCTABadge = () => {
  return (
    <Badge className="w-full py-2 mb-3 rounded-md">
      <a href={outLinks.ririkku} target="_blank" rel="noopener noreferrer">
        Lyrics make Japanese stick.{" "}
        <span className="underline">{"Ririkku,"}</span> the{" Internet's"}{" "}
        coolest music player™ helps you absorb real Japanese from memorable
        songs.
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

const DetailsNotice = ({
  icon: Icon,
  children,
}: {
  icon: typeof Volume2;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-3 px-3 py-2">
    <span className="flex items-center justify-center size-8 shrink-0 rounded-xl border-foreground/20 bg-background/40 text-foreground/70">
      <Icon className="size-4" />
    </span>
    <p className="pt-1 text-xs leading-relaxed text-left text-foreground">
      {children}
    </p>
  </div>
);

export const KanjiDetailsBottom = ({ kanji }: { kanji: string }) => {
  return (
    <div className="my-4">
      <div className="overflow-hidden border rounded-2xl border-foreground/20 bg-muted/15">
        <h3 className="px-3 pt-2.5 pb-1.5 text-xs font-bold tracking-widest text-left uppercase border-b text-foreground/50">
          ⚠️ Note
        </h3>
        <DetailsNotice icon={Volume2}>
          Speak buttons 🔊 🎧 use your {"browser's"} built-in text-to-speech,
          which may not work on some devices.
        </DetailsNotice>
        <div className="mx-3 border-t border-dotted border-foreground/15" />
        <DetailsNotice icon={Bug}>
          We strive for accuracy, but mistakes can happen. Found a content
          issue?
          <ExternalTextLink
            href={outLinks.githubContentIssue}
            text="Report here!"
          />
        </DetailsNotice>
      </div>

      <BottomBar includeNode={<KanjiKeyboardShortcuts kanji={kanji} />} />
      <div className="flex w-full pt-2 mt-6 mb-12 border-t border-dashed justify-left gap-x-1">
        <InstallAppModal />
      </div>
    </div>
  );
};
const StrokeAnimation = lazy(() => import("./StrokeAnimation"));
const KanjiStudyNotes = lazy(() => import("./KanjiStudyNotes"));
const KanjiEssay = lazy(() => import("./KanjiEssay"));

const RepresentativeStudyWordAccordion = ({ kanji }: { kanji: string }) => {
  const info = useKanjiRepresentativeWordDetails(kanji);

  return (
    <>
      <SimpleAccordion
        trigger={`Anchor Word${info?.word ? `: ${info?.word}` : ""}`}
        defaultOpen={false}
      >
        <RepresentativeStudyWord kanji={kanji} />
      </SimpleAccordion>
    </>
  );
};

export const KanjiDetails = ({
  kanji,
  smallScreenNode,
}: {
  kanji: string;
  smallScreenNode: ReactNode;
}) => {
  const getInfo = useGetKanjiInfoFn();

  if (getInfo == null) {
    return <BasicLoading />;
  }

  const data = getInfo(kanji);

  return (
    <div className="py-2 mx-2">
      <KanjiWordStatusActions kanji={kanji} />
      <div className="relative p-0 m-0 md:hidden">
        <SimpleAccordion trigger={`${kanji} Reference Card`} defaultOpen={true}>
          {smallScreenNode}
        </SimpleAccordion>
      </div>
      <SimpleAccordion trigger={"General Information"} defaultOpen={true}>
        <General kanji={kanji} />
      </SimpleAccordion>
      <SimpleAccordion trigger={`Stroke Order · Writing Practice`}>
        <ErrorBoundary details="StrokeAnimation in KanjiDetails">
          <Suspense fallback={<StrokeAnimationLoadingScreen />}>
            <StrokeAnimation kanji={kanji} />
          </Suspense>
        </ErrorBoundary>
      </SimpleAccordion>
      <RepresentativeStudyWordAccordion kanji={kanji} />
      <SimpleAccordion trigger={`Textbook Vocabulary Containing ${kanji}`}>
        <ErrorBoundary details="TextbookVocabulary in KanjiDetails">
          <TextbookVocabulary kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger={`Sample Words Starting with ${kanji}`}>
        <ErrorBoundary details="SampleVocabulary in KanjiDetails">
          <SampleVocabulary kanji={kanji} />
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
      <SimpleAccordion trigger="⭐️ Personal Study Notes">
        <ErrorBoundary details="KanjiStudyNotes in KanjiDetails">
          <Suspense fallback={<StudyNotesLoadingFallback />}>
            <KanjiStudyNotes key={kanji} kanji={kanji} />
          </Suspense>
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion trigger="Kanji Essay">
        <ErrorBoundary details="KanjiEssay in KanjiDetails">
          <Suspense fallback={<StudyNotesLoadingFallback />}>
            <KanjiEssay
              key={kanji}
              kanji={kanji}
              keyword={data?.keyword ?? ""}
            />
          </Suspense>
        </ErrorBoundary>
      </SimpleAccordion>

      <SimpleAccordion trigger={"Reading Usefulness"}>
        <ErrorBoundary details="ReadingFrequencyCategory in KanjiDetails">
          <ReadingFrequencyCategory kanji={kanji} />
        </ErrorBoundary>
      </SimpleAccordion>
      <SimpleAccordion
        trigger={`External Links for ${kanji}`}
        defaultOpen={true}
      >
        <div className="mt-2 text-left">
          <ExternalKanjiLinks kanji={kanji} />
        </div>
      </SimpleAccordion>
      <KanjiDetailsBottom kanji={kanji} />
    </div>
  );
};
