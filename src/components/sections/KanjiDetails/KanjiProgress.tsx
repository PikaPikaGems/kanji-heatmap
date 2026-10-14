import { Eye, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { openLoginDialog } from "@/lib/engine/login-dialog";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useReviewPileItem } from "@/lib/engine/use-review-pile-item";
import { StudyNoteNotice } from "./KanjiStudyNotes/StudyNoteNotice";
import { ProgressCard } from "./ProgressCard";

const Message = ({ children }: { children: string }) => (
  <p className="p-3 text-sm text-left text-muted-foreground">{children}</p>
);

/** Logged in: the kanji's reading and writing cards from `pile.watch`. */
const ActiveKanjiProgress = ({ kanji }: { kanji: string }) => {
  const snapshot = useReviewPileItem(kanji);

  if (snapshot.status === "loading" || snapshot.status === "unavailable") {
    return (
      <div
        className="flex items-center justify-center w-full h-24"
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (snapshot.status === "failed" || !snapshot.result.ok) {
    return <Message>Your progress isn&apos;t available right now.</Message>;
  }

  const item = snapshot.result.value;
  if (item === null) {
    return (
      <Message>Add this kanji to your review pile to start tracking.</Message>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2 pb-2 sm:gap-3 xl:grid-cols-2">
      <ProgressCard title="Reading" Icon={Eye} card={item.reading} />
      <ProgressCard title="Writing" Icon={PenLine} card={item.writing} />
    </div>
  );
};

/**
 * Review progress for one kanji, from its review-pile item. What shows depends
 * on the account: the cards when logged in, a log-in prompt when logged out,
 * and an explanation otherwise. The caller hides the section in builds
 * without the engine.
 */
const KanjiProgress = ({ kanji }: { kanji: string }) => {
  const status = useAccountStatus();

  if (status.kind === "unavailable") {
    return <Message>{UPDATE_BROWSER_COPY}</Message>;
  }
  if (status.kind === "error" || status.kind === "recovery") {
    return <Message>Your progress isn&apos;t available right now.</Message>;
  }
  if (status.kind === "loading") {
    return (
      <div
        className="flex items-center justify-center w-full h-24"
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }
  if (status.kind === "signed-out") {
    return (
      <StudyNoteNotice>
        <span>⚠️ You&apos;re not logged in. Log in to see your progress.</span>
        <Button variant="outline" size="sm" onClick={openLoginDialog}>
          Log in
        </Button>
      </StudyNoteNotice>
    );
  }
  return <ActiveKanjiProgress kanji={kanji} />;
};

export default KanjiProgress;
