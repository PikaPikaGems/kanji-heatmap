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
    return <>Not private: anyone using this device can see it and delete it.</>;
  if (owner.status === "known" && owner.ownerId !== GUEST_OWNER_ID)
    return (
      <>
        Shown only while you&apos;re logged in, but anyone logged in on this
        device can delete it.
      </>
    );
  return (
    <>
      Not private: anyone using this device while logged out can see it and
      delete it.
    </>
  );
};

/**
 * Where AI content lives and how it can be lost: one point per row. Says
 * "device" for what is strictly this browser's storage, as people think of it.
 */
export const AiContentStorageNote = ({ className }: { className?: string }) => (
  <NoteCard title="Saved only on this device" className={className}>
    <NoteRow icon={CloudOff}>
      Not backed up. Clearing this site&apos;s data deletes it.
    </NoteRow>
    <NoteRow icon={TimerOff}>
      Your device can also delete it by itself, for example when it&apos;s low
      on space.
    </NoteRow>
    <NoteRow icon={Eye}>
      <WhoCanSeeIt />
    </NoteRow>
    <NoteRow icon={Users}>
      AI Explain answers are shared: everyone using this device sees the same
      answer for a sentence or word.
    </NoteRow>
    <NoteRow icon={Download}>Download anything you want to keep.</NoteRow>
  </NoteCard>
);
