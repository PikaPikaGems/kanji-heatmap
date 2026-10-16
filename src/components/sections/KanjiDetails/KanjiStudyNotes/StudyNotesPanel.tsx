import { type ReactNode, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { SegmentedTabsList } from "@/components/ui/segmented-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { HighlightKanjiSwitch } from "./HighlightKanjiSwitch";
import { MarkdownEditor, type MarkdownEditorProps } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import { StudyNotesTipsPopover } from "./StudyNotesTipsPopover";
import { StudyNotesFullscreenEditor } from "./StudyNotesFullscreenEditor";

export type NotesMode = "edit" | "view";

/**
 * The note UI shared by the signed-out and signed-in notes: the Edit / View
 * tabs, the markdown editor (a full-screen one on touch devices) and the
 * preview. It owns no note data; the parent decides what is shown and what a
 * mode change means (starting a draft, saving, taking the editor lock).
 */
export const StudyNotesPanel = ({
  kanji,
  mode,
  onModeChange,
  viewSource,
  editor,
  notices,
}: {
  kanji: string;
  mode: NotesMode;
  onModeChange: (mode: NotesMode) => void;
  /** Markdown shown in View mode. */
  viewSource: string;
  editor: Pick<
    MarkdownEditorProps,
    "value" | "maxBytes" | "onChange" | "disabled" | "status"
  >;
  /** Messages above the note; also shown above the full-screen editor. */
  notices?: ReactNode;
}) => {
  const isCoarsePointer = useCoarsePointer();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // The full-screen editor only exists while editing, so the parent leaving
  // edit mode (another device changed the note) closes it too.
  const fullscreenVisible =
    isCoarsePointer && fullscreenOpen && mode === "edit";

  const openEditor = () => {
    onModeChange("edit");
    if (isCoarsePointer) {
      setFullscreenOpen(true);
    }
  };

  const handleModeChange = (value: string) => {
    const next = value as NotesMode;
    onModeChange(next);
    if (next === "edit" && isCoarsePointer) {
      setFullscreenOpen(true);
    }
  };

  const handleFullscreenOpenChange = (open: boolean) => {
    setFullscreenOpen(open);
    if (!open && editor.value.trim().length > 0) {
      onModeChange("view");
    }
  };

  return (
    <div
      className="px-1 pt-2 pb-3"
      onKeyDown={(event) => event.stopPropagation()}
    >
      {notices ? (
        <div className="flex flex-col gap-2 mb-3">{notices}</div>
      ) : null}
      <Tabs value={mode} onValueChange={handleModeChange}>
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
          <SegmentedTabsList
            value={mode}
            label="Kanji study notes mode"
            className="mb-2"
            options={[
              { value: "edit", label: "Edit Mode" },
              { value: "view", label: "View Mode" },
            ]}
          />
          {mode === "view" ? (
            <HighlightKanjiSwitch className="mb-2 pl-2 sm:ml-auto" />
          ) : null}
        </div>
        <TabsContent
          value="edit"
          className="mt-1.5 motion-safe:data-[state=active]:animate-in motion-safe:data-[state=active]:fade-in-0 motion-safe:data-[state=active]:slide-in-from-bottom-1 motion-safe:data-[state=active]:duration-200"
        >
          {isCoarsePointer ? (
            <div className="flex flex-col items-stretch gap-3 rounded-xl border-[3px] border-dashed border-border bg-background px-4 py-8 text-center">
              <PracticeButton
                size="lg"
                disabled={editor.disabled}
                onClick={() => setFullscreenOpen(true)}
              >
                {editor.value.trim().length > 0
                  ? "Continue writing"
                  : "Start writing"}
              </PracticeButton>
              {editor.status ? (
                <div className="flex justify-center text-xs">
                  {editor.status}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="text-left">
                <StudyNotesTipsPopover className="mb-3" />
              </div>
              <MarkdownEditor {...editor} />
            </>
          )}
        </TabsContent>
        <TabsContent
          value="view"
          className="mt-1.5 motion-safe:data-[state=active]:animate-in motion-safe:data-[state=active]:fade-in-0 motion-safe:data-[state=active]:slide-in-from-bottom-1 motion-safe:data-[state=active]:duration-200"
        >
          <div className="overflow-hidden bg-background rounded-xl border-[3px] border-dashed pb-4 border-border">
            <MarkdownPreview source={viewSource} onEmptyClick={openEditor} />
          </div>
        </TabsContent>
      </Tabs>

      {isCoarsePointer ? (
        <StudyNotesFullscreenEditor
          open={fullscreenVisible}
          onOpenChange={handleFullscreenOpenChange}
          kanji={kanji}
          notices={notices}
          {...editor}
        />
      ) : null}
    </div>
  );
};
