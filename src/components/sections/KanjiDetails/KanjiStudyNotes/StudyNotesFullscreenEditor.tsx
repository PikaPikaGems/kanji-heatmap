import type { ReactNode } from "react";
import { FullscreenEditorDialog } from "@/components/common/FullscreenEditorDialog";
import { MarkdownEditor, type MarkdownEditorProps } from "./MarkdownEditor";
import { StudyNotesTipsPopover } from "./StudyNotesTipsPopover";

interface StudyNotesFullscreenEditorProps
  extends Pick<
    MarkdownEditorProps,
    "value" | "maxBytes" | "onChange" | "disabled" | "status"
  > {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanji: string;
  /** Messages shown above the editor (read-only reason, merge notice, ...). */
  notices?: ReactNode;
}

export const StudyNotesFullscreenEditor = ({
  open,
  onOpenChange,
  kanji,
  value,
  maxBytes,
  onChange,
  disabled,
  status,
  notices,
}: StudyNotesFullscreenEditorProps) => (
  <FullscreenEditorDialog
    open={open}
    onOpenChange={onOpenChange}
    title={
      <>
        <span className="text-2xl leading-none kanji-font">{kanji}</span>
        <span>Study Notes</span>
      </>
    }
    description={`Write personal study notes for ${kanji}.`}
    headerExtra={
      <StudyNotesTipsPopover contentClassName="z-[70] m-0 w-[calc(100vw-2rem)] max-w-sm p-0" />
    }
  >
    {notices ? <div className="flex flex-col gap-2">{notices}</div> : null}
    <MarkdownEditor
      value={value}
      maxBytes={maxBytes}
      onChange={onChange}
      disabled={disabled}
      status={status}
      fill
      autoFocus
    />
  </FullscreenEditorDialog>
);
