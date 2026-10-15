import { FullscreenEditorDialog } from "@/components/common/FullscreenEditorDialog";
import { MarkdownEditor } from "./MarkdownEditor";
import { StudyNotesTipsPopover } from "./StudyNotesTipsPopover";

interface StudyNotesFullscreenEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanji: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}

export const StudyNotesFullscreenEditor = ({
  open,
  onOpenChange,
  kanji,
  value,
  maxLength,
  onChange,
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
    <MarkdownEditor
      value={value}
      maxLength={maxLength}
      onChange={onChange}
      fill
      autoFocus
    />
  </FullscreenEditorDialog>
);
