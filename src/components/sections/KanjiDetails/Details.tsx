import { SectionLoading } from "@/components/common/SectionLoading";
import { lazy, ReactNode, Suspense } from "react";
import { Bug, Volume2 } from "lucide-react";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { ErrorBoundary } from "@/components/error";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { BasicLoading } from "@/components/common/BasicLoading";
import { FrequencyInfo } from "./FrequencyInfo";
import { General } from "./General";
import { KanjiKeyboardShortcuts } from "./KanjiKeyboardShortcuts";
import { ReadingFrequencyCategory as ReadingUsefulnessTable } from "./ReadingFrequencyCategory";
import { SampleVocabulary } from "./SampleVocabulary";
import { TextbookVocabulary } from "./TextbookVocabulary";
import { Badge } from "@/components/ui/badge";
import { outLinks } from "@/lib/external-links";
import { ExternalKanjiLinks } from "@/components/common/ExternalKanjiLinks";
import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { StructureInfo } from "./StructureInfo";
import { RepresentativeStudyWord } from "./RepresentativeStudyWord";
import { BottomBar } from "@/components/common/BottomBar";
import { useKanjiAnchorWords } from "@/providers/kanji-representative-word-hooks";
import { KanjiWordStatusActions } from "./KanjiWordStatusActions";
import { StudyNotesAccordion } from "./StudyNotesAccordion";
import { YourProgressAccordion } from "./YourProgressAccordion";
import { StrokeAnimationLoadingScreen } from "./StrokeAnimationLoadingScreen";
import { InstallAppModal } from "@/components/common/InstallAppModal";
import { NetworkStatusBadge } from "@/components/common/NetworkStatusBadge";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { isAiExplainReady } from "@/lib/ai-explain/preferences";
import { NoticeAction } from "@/components/common/UserNotice";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";

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
  <div className="flex items-start px-3 py-2">
    <Icon className="mr-2 mt-0.5 text-yellow-600 size-4 shrink-0 dark:text-yellow-500" />
    <p className="text-xs leading-relaxed text-left text-foreground">
      {children}
    </p>
  </div>
);

/**
 * Logged out: log in for natural-sounding audio. Logged in: that audio,
 * with the device's own voice when a file isn't available.
 */
const SpeechNote = () => {
  const status = useAccountStatus();

  if (status.kind === "signed-out") {
    return (
      <>
        <NoticeAction onClick={openLoginDialog}>Log in</NoticeAction> for
        natural-sounding speech 🔊 🎧. Until then, speak buttons use your
        {" device's"} built-in voice, which may not work on every device.
      </>
    );
  }
  if (status.kind === "active") {
    return (
      <>
        Speak buttons 🔊 🎧 play natural-sounding audio, and use your
        {" device's"} built-in voice when audio isn&apos;t available.
      </>
    );
  }
  return (
    <>
      Speak buttons 🔊 🎧 use your {"device's"} built-in voice, which may not
      work on every device.
    </>
  );
};

export const KanjiDetailsBottom = ({ kanji }: { kanji: string }) => {
  return (
    <div className="my-4">
      <div className="overflow-hidden border rounded-2xl border-foreground/20 bg-muted/15">
        <h3 className="px-3 pt-2.5 pb-1.5 text-xs font-bold tracking-widest text-left uppercase border-b text-foreground/50">
          Note
        </h3>
        <DetailsNotice icon={Volume2}>
          <SpeechNote />
        </DetailsNotice>
        <div className="mx-3 border-t border-dotted border-foreground/15" />
        <DetailsNotice icon={Bug}>
          We strive for accuracy, but mistakes can happen. Found a content
          issue?
          <ExternalTextLink
            href={outLinks.githubContentIssue}
            text="Suggest an edit."
          />
        </DetailsNotice>
      </div>

      <BottomBar includeNode={<KanjiKeyboardShortcuts kanji={kanji} />} />
      <div className="flex flex-col items-start w-full gap-2 pt-2 mt-6 mb-12 border-t border-dashed">
        <InstallAppModal />
        <NetworkStatusBadge />
      </div>
    </div>
  );
};
const StrokeAnimation = lazy(() => import("./StrokeAnimation"));
const KanjiEssay = lazy(() => import("./KanjiEssay"));
const VisualMnemonics = lazy(() => import("./VisualMnemonics"));

const RepresentativeStudyWordAccordion = ({ kanji }: { kanji: string }) => {
  const anchors = useKanjiAnchorWords(kanji);
  const words = anchors
    ? [anchors.main.word, anchors.secondary?.word].filter(Boolean).join(" · ")
    : "";

  return (
    <>
      <SimpleAccordion
        trigger={`${anchors?.secondary ? "Anchor Words" : "Anchor Word"}${words ? `: ${words}` : ""}`}
        defaultOpen={false}
      >
        <RepresentativeStudyWord kanji={kanji} />
      </SimpleAccordion>
    </>
  );
};

const ReadingUsefulnessAccordion = ({ kanji }: { kanji: string }) => (
  <SimpleAccordion trigger="Reading Usefulness">
    <ErrorBoundary details="ReadingFrequencyCategory in KanjiDetails">
      <ReadingUsefulnessTable kanji={kanji} />
    </ErrorBoundary>
  </SimpleAccordion>
);

export const KanjiDetails = ({
  kanji,
  smallScreenNode,
}: {
  kanji: string;
  smallScreenNode: ReactNode;
}) => {
  const getInfo = useGetKanjiInfoFn();
  const [aiSettings] = useAiExplainSettings();

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
      {isAiExplainReady(aiSettings) && (
        <SimpleAccordion trigger="Kanji Essay">
          <ErrorBoundary details="KanjiEssay in KanjiDetails">
            <Suspense fallback={<SectionLoading />}>
              <KanjiEssay
                key={kanji}
                kanji={kanji}
                keyword={data?.keyword ?? ""}
              />
            </Suspense>
          </ErrorBoundary>
        </SimpleAccordion>
      )}
      {isAiExplainReady(aiSettings) && (
        <SimpleAccordion trigger="Visual Mnemonics">
          <ErrorBoundary details="VisualMnemonics in KanjiDetails">
            <Suspense fallback={<SectionLoading />}>
              <VisualMnemonics
                key={kanji}
                kanji={kanji}
                keyword={data?.keyword ?? ""}
              />
            </Suspense>
          </ErrorBoundary>
        </SimpleAccordion>
      )}
      <RepresentativeStudyWordAccordion kanji={kanji} />
      <StudyNotesAccordion kanji={kanji} />
      <YourProgressAccordion kanji={kanji} />
      <ReadingUsefulnessAccordion kanji={kanji} />
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
