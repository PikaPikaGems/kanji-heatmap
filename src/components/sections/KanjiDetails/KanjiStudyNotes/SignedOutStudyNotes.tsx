import { useState } from "react";
import { LoginNotice } from "@/components/dependent/account/LoginNotice";
import { readNoteDraft, writeNoteDraft } from "./draft-storage";
import { type NotesMode, StudyNotesPanel } from "./StudyNotesPanel";

/**
 * Notes while signed out: typing works, but nothing is saved. The text lives
 * in sessionStorage (`kh-note-draft:<kanji>`) so it survives switching kanji,
 * and is offered back after login (see ActiveStudyNotes).
 */
export const SignedOutStudyNotes = ({
  kanji,
  maxBytes,
}: {
  kanji: string;
  maxBytes: number;
}) => {
  const [text, setText] = useState(() => readNoteDraft(kanji));
  const [mode, setMode] = useState<NotesMode>(
    text.length > 0 ? "view" : "edit"
  );

  const handleChange = (value: string) => {
    setText(value);
    writeNoteDraft(kanji, value);
  };

  return (
    <StudyNotesPanel
      kanji={kanji}
      mode={mode}
      onModeChange={setMode}
      viewSource={text}
      editor={{
        value: text,
        onChange: handleChange,
        maxBytes,
        disabled: false,
      }}
      notices={() => (
        <LoginNotice to="save this note, or it will be lost when you close this tab" />
      )}
    />
  );
};
