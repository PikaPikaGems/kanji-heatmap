import { SectionLoading } from "@/components/common/SectionLoading";
import { UserNotice } from "@/components/common/UserNotice";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import {
  getWriteBlocker,
  useAccountStatus,
} from "@/lib/engine/use-account-status";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import { ActiveStudyNotes } from "./ActiveStudyNotes";
import { SignedOutStudyNotes } from "./SignedOutStudyNotes";

const Message = ({ children }: { children: string }) => (
  <UserNotice className="p-3">{children}</UserNotice>
);

/**
 * Personal study notes for one kanji. The note lives in the account, so what
 * shows depends on it: an editor saved by the engine when logged in, a
 * throwaway draft when logged out, and an explanation otherwise. The caller
 * hides the whole section in builds without the engine.
 */
const KanjiStudyNotes = ({ kanji }: { kanji: string }) => {
  const status = useAccountStatus();
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

  return (
    <ActiveStudyNotes
      kanji={kanji}
      api={api}
      writeBlocker={getWriteBlocker(status)}
    />
  );
};

export default KanjiStudyNotes;
