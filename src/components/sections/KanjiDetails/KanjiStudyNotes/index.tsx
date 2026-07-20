import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";

export const MAX_STUDY_NOTE_LENGTH = 1000;

export const getKanjiStudyNotesStorageKey = (kanji: string) =>
  `kanji-study-notes:v1:${encodeURIComponent(kanji)}`;

interface StoredStudyNotes {
  notes: string;
}

type NotesMode = "edit" | "preview";

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
    notes.length > 0 ? "preview" : "edit"
  );

  return (
    <div className="px-1 pt-2 pb-3">
      <Tabs value={mode} onValueChange={(value) => setMode(value as NotesMode)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList aria-label="Kanji study notes mode">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground">
            Saved automatically on this device
          </p>
        </div>
        <TabsContent value="edit">
          <MarkdownEditor
            value={notes}
            maxLength={MAX_STUDY_NOTE_LENGTH}
            onChange={(value) =>
              setStoredNotes("notes", value.slice(0, MAX_STUDY_NOTE_LENGTH))
            }
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Japanese words become clickable in Preview. Optional details:{" "}
            <code className="break-all">
              {`:vocab[日本語]{kana="にほんご" definition="Japanese language"}`}
            </code>
          </p>
        </TabsContent>
        <TabsContent value="preview">
          <MarkdownPreview source={notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KanjiStudyNotes;
