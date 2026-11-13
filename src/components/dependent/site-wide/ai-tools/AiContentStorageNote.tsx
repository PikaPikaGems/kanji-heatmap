import { CloudOff, Download, Eye, TimerOff, Users } from "lucide-react";
import { NoteCard, NoteRow } from "@/components/common/NoteCard";
import { GUEST_OWNER_ID, useCurrentOwner } from "@/lib/engine/content-owner";
import {
  hasNoAccounts,
  useAccountStatus,
} from "@/lib/engine/use-account-status";

/**
 * Who can see or delete it: a guest's content is open to anyone logged out,
 * an account's only shows while it's logged in, and anyone logged in can
 * delete either (AI Study Tools → Usage).
 */
const WhoCanSeeIt = () => {
  const owner = useCurrentOwner();
  const account = useAccountStatus();
  if (hasNoAccounts(account))
    return (
      <>Not private: anyone using this browser can see it and delete it.</>
    );
  if (owner.status === "known" && owner.ownerId !== GUEST_OWNER_ID)
    return (
      <>
        Shown only while you&apos;re logged in, but anyone logged in on this
        browser can delete it.
      </>
    );
  return (
    <>
      Not private: anyone using this browser while logged out can see it and
      delete it.
    </>
  );
};

/** Where AI content lives and how it can be lost: one point per row. */
export const AiContentStorageNote = ({ className }: { className?: string }) => (
  <NoteCard title="Saved only in this browser" className={className}>
    <NoteRow icon={CloudOff}>
      Not backed up. Clearing browser data deletes it.
    </NoteRow>
    <NoteRow icon={TimerOff}>
      The browser can also delete it on its own: after 7 days unused in Safari
      (unless the app is added to the Home Screen), or when the device is low on
      space.
    </NoteRow>
    <NoteRow icon={Eye}>
      <WhoCanSeeIt />
    </NoteRow>
    <NoteRow icon={Users}>
      AI Explain answers are shared: everyone using this browser sees the same
      answer for a sentence or word.
    </NoteRow>
    <NoteRow icon={Download}>Download anything you want to keep.</NoteRow>
  </NoteCard>
);
