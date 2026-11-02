import { SectionLoading } from "@/components/common/SectionLoading";
import { UserNotice } from "@/components/common/UserNotice";
import { NotDownloadedCard } from "@/components/dependent/account/DownloadAgain";
import { useDataDownload, useWriteBlocker } from "@/lib/engine/data-download";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { ActiveStudyNotes } from "./ActiveStudyNotes";
import { SignedOutStudyNotes } from "./SignedOutStudyNotes";

const Message = ({ children }: { children: string }) => (
  <UserNotice className="p-3">{children}</UserNotice>
);

/**
 * Personal study notes for one kanji. The note lives in the account, so what
 * shows depends on it: an editor saved by the engine when logged in, a
 * throwaway draft when logged out, and an explanation otherwise (including
 * an account whose data hasn't downloaded to this device yet). The caller
 * hides the whole section in builds without the engine.
 */
const KanjiStudyNotes = ({ kanji }: { kanji: string }) => {
  const status = useAccountStatus();
  const download = useDataDownload();
  const writeBlocker = useWriteBlocker();
  const api = useEngineApi();

  if (status.kind === "unavailable") {
    return <Message>{UPDATE_BROWSER_COPY}</Message>;
  }
  if (status.kind === "error" || status.kind === "recovery") {
    return <Message>Your notes aren&apos;t available right now.</Message>;
  }
  if (status.kind === "loading" || api == null) {
    return <SectionLoading />;
  }
  if (status.kind === "signed-out") {
    return (
      <SignedOutStudyNotes
        kanji={kanji}
        maxBytes={api.notes.notesMaxUtf8Bytes}
      />
    );
  }

  // The note can't load until the account's data is on this device.
  if (download !== "ready") {
    return <NotDownloadedCard title="Your notes haven't downloaded yet." />;
  }

  return (
    <ActiveStudyNotes kanji={kanji} api={api} writeBlocker={writeBlocker} />
  );
};

export default KanjiStudyNotes;
