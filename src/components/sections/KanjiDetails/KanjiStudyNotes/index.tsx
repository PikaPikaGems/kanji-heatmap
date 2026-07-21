import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
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
  const [mode, setMode] = useState<NotesMode>(
    notes.length > 0 ? "view" : "edit"
  );

  return (
    <div
      className="px-1 pt-2 pb-3"
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Tabs value={mode} onValueChange={(value) => setMode(value as NotesMode)}>
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
          <MarkdownEditor
            value={notes}
            maxLength={MAX_STUDY_NOTE_LENGTH}
            onChange={(value) =>
              setStoredNotes("notes", value.slice(0, MAX_STUDY_NOTE_LENGTH))
            }
          />
          <p className="mt-3 text-xs leading-snug text-muted-foreground">
            Fun fact! Japanese texts are clickable in View Mode. <br />
            Optional special syntax:{" "}
            <code className="text-[0.7rem] break-all">
              {`:vocab[日本語]{kana="にほんご" definition="Japanese language (my own definition)"}`}
            </code>
          </p>
        </TabsContent>
        <TabsContent
          value="view"
          className="mt-1.5 motion-safe:data-[state=active]:animate-in motion-safe:data-[state=active]:fade-in-0 motion-safe:data-[state=active]:slide-in-from-bottom-1 motion-safe:data-[state=active]:duration-200"
        >
          <div className="overflow-hidden bg-background rounded-xl border-[3px] border-dashed border-border">
            <MarkdownPreview source={notes} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KanjiStudyNotes;
