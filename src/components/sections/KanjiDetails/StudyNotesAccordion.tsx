import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
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
        <Suspense
          fallback={
            <div
              className="flex items-center justify-center w-full h-48"
              role="status"
              aria-label="Loading"
            >
              <Loader2 className="size-7 animate-spin" />
            </div>
          }
        >
          <KanjiStudyNotes key={kanji} kanji={kanji} />
        </Suspense>
      </ErrorBoundary>
    </SimpleAccordion>
  );
};
