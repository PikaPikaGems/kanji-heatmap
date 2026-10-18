import { SectionLoading } from "@/components/common/SectionLoading";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { isAccountUiHidden } from "@/lib/engine/account-ui";
import { useAccountStatus } from "@/lib/engine/use-account-status";

const KanjiStudyNotes = lazy(() => import("./KanjiStudyNotes"));

/** Notes live in the account, so builds without the study engine have none. */
export const StudyNotesAccordion = ({ kanji }: { kanji: string }) => {
  const status = useAccountStatus();
  if (isAccountUiHidden(status)) return null;

  return (
    <SimpleAccordion trigger="Personal Study Notes">
      <ErrorBoundary details="KanjiStudyNotes in KanjiDetails">
        <Suspense fallback={<SectionLoading />}>
          <KanjiStudyNotes key={kanji} kanji={kanji} />
        </Suspense>
      </ErrorBoundary>
    </SimpleAccordion>
  );
};
