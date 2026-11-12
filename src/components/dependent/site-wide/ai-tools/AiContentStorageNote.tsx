import { CloudOff, Download, Eye, TimerOff } from "lucide-react";
import { NoteCard, NoteRow } from "@/components/common/NoteCard";

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
      Not private: anyone using this computer can see it.
    </NoteRow>
    <NoteRow icon={Download}>Download anything you want to keep.</NoteRow>
  </NoteCard>
);
