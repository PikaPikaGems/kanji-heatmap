import { ErrorBoundary } from "@/components/error";
import SimpleAccordion from "@/components/common/SimpleAccordion";
import { isAccountUiHidden } from "@/lib/engine/account-ui";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import KanjiProgress from "./KanjiProgress";

/** Progress lives in the account, so builds without the study engine have none. */
export const YourProgressAccordion = ({ kanji }: { kanji: string }) => {
  const status = useAccountStatus();
  if (isAccountUiHidden(status)) return null;

  return (
    <SimpleAccordion trigger="Your Progress">
      <ErrorBoundary details="KanjiProgress in KanjiDetails">
        <KanjiProgress key={kanji} kanji={kanji} />
      </ErrorBoundary>
    </SimpleAccordion>
  );
};
