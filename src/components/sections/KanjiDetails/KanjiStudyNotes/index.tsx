import { useState } from "react";
import { LocalStorageWarning } from "@/components/common/LocalStorageWarning";
import { PracticeButton } from "@/components/ui/practice-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import { StudyNotesEditorTips } from "./StudyNotesEditorTips";
import { StudyNotesFullscreenEditor } from "./StudyNotesFullscreenEditor";
import { getKanjiStudyNotesStorageKey, MAX_STUDY_NOTE_LENGTH } from "./storage";

interface StoredStudyNotes {
  notes: string;
}

type NotesMode = "edit" | "view";

const KanjiStudyNotes = ({ kanji }: { kanji: string }) => {
  const [storedNotes, setStoredNotes] = useLocalStorage<StoredStudyNotes>(
    getKanjiStudyNotesStorageKey(kanji),
    { notes: "" }
  );
  const notes =
    typeof storedNotes.notes === "string"
      ? storedNotes.notes.slice(0, MAX_STUDY_NOTE_LENGTH)
      : "";
  const isCoarsePointer = useCoarsePointer();
  const [mode, setMode] = useState<NotesMode>(
    notes.length > 0 ? "view" : "edit"
  );
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const persistNotes = (value: string) => {
    setStoredNotes("notes", value.slice(0, MAX_STUDY_NOTE_LENGTH));
  };

  const openEditor = () => {
    setMode("edit");
    if (isCoarsePointer) {
      setFullscreenOpen(true);
    }
  };

  const handleModeChange = (value: string) => {
    const next = value as NotesMode;
    setMode(next);
    if (next === "edit" && isCoarsePointer) {
      setFullscreenOpen(true);
    }
  };

  const handleFullscreenOpenChange = (open: boolean) => {
    setFullscreenOpen(open);
    if (!open && notes.trim().length > 0) {
      setMode("view");
    }
  };

  return (
    <div
      className="px-1 pt-2 pb-3"
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Tabs value={mode} onValueChange={handleModeChange}>
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
          <TabsList
            aria-label="Kanji study notes mode"
            className="relative h-10 gap-0.5 p-0.5 rounded-full border border-border bg-muted/70 mb-2"
          >
            <div className="absolute inset-0.5 pointer-events-none" aria-hidden>
              <div
                className="w-1/2 h-full transition-transform duration-300 ease-out rounded-full shadow-sm bg-background"
                style={{
                  transform: `translateX(${mode === "view" ? 100 : 0}%)`,
                }}
              />
            </div>
            <TabsTrigger
              value="edit"
              className="relative z-10 flex-1 px-4 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Edit Mode
            </TabsTrigger>
            <TabsTrigger
              value="view"
              className="relative z-10 flex-1 px-4 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              View Mode
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="edit"
          className="mt-1.5 motion-safe:data-[state=active]:animate-in motion-safe:data-[state=active]:fade-in-0 motion-safe:data-[state=active]:slide-in-from-bottom-1 motion-safe:data-[state=active]:duration-200"
        >
          {isCoarsePointer ? (
            <div className="flex flex-col items-stretch gap-3 rounded-xl border-[3px] border-dashed border-border bg-background px-4 py-8 text-center">
              <PracticeButton size="lg" onClick={() => setFullscreenOpen(true)}>
                {notes.trim().length > 0 ? "Continue writing" : "Start writing"}
              </PracticeButton>
            </div>
          ) : (
            <>
              <StudyNotesEditorTips className="mb-3" />
              <MarkdownEditor
                value={notes}
                maxLength={MAX_STUDY_NOTE_LENGTH}
                onChange={persistNotes}
              />
              <LocalStorageWarning className="pb-2" />
            </>
          )}
        </TabsContent>
        <TabsContent
          value="view"
          className="mt-1.5 motion-safe:data-[state=active]:animate-in motion-safe:data-[state=active]:fade-in-0 motion-safe:data-[state=active]:slide-in-from-bottom-1 motion-safe:data-[state=active]:duration-200"
        >
          <div className="overflow-hidden bg-background rounded-xl border-[3px] border-dashed pb-4 border-border">
            <MarkdownPreview source={notes} onEmptyClick={openEditor} />
          </div>
        </TabsContent>
      </Tabs>

      {isCoarsePointer ? (
        <StudyNotesFullscreenEditor
          open={fullscreenOpen}
          onOpenChange={handleFullscreenOpenChange}
          kanji={kanji}
          value={notes}
          maxLength={MAX_STUDY_NOTE_LENGTH}
          onChange={persistNotes}
        />
      ) : null}
    </div>
  );
};

export default KanjiStudyNotes;
