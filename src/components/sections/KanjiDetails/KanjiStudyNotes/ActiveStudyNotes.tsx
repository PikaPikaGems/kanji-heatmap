import { SectionLoading } from "@/components/common/SectionLoading";
import { WriteBlockerCopy } from "@/components/dependent/account/WriteBlockedDialog";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { EngineAPI, KanjiNoteView } from "engine-contract";
import type { ActionStatus } from "@/components/dependent/account/action-status";
import { NoticeAction, UserNotice } from "@/components/common/UserNotice";
import { copyForCode } from "@/lib/engine/engine-copy";
import { snapshotValue } from "@/lib/engine/store-cache";
import type { WriteBlocker } from "@/lib/engine/use-account-status";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { clearNoteDraft, readNoteDraft } from "./draft-storage";
import { NoteSaveStatus } from "./NoteSaveStatus";
import { type NotesMode, StudyNotesPanel } from "./StudyNotesPanel";
import { useNoteEditLock } from "./use-note-edit-lock";
import { utf8ByteLength } from "./utf8-bytes";

/**
 * Quiet time after the last keystroke before a note is saved. Leaving Edit
 * Mode, closing the drawer and moving to another kanji save at once.
 */
const SAVE_DELAY_MS = 3000;

type NoteBase = { revision: number; content: string };

type EditSession = {
  /**
   * The watched note this draft is based on: `revision` is what save()
   * expects. Moves forward only onto content that is ours (see reconcile).
   */
  base: NoteBase;
  draft: string;
  /** Text most recently handed to save(); null before the first save. */
  sent: string | null;
};

/**
 * `kept` is the draft that was interrupted (another device edited the note,
 * or save() said `stale_version`). It is never saved on its own: entering edit
 * mode again puts it above the current text so the person decides.
 */
type NotesState =
  | { mode: "view"; kept: string | null; changedElsewhere: boolean }
  | { mode: "edit"; session: EditSession };

/** A draft typed while signed out, now waiting in the editor (not saved yet). */
type LoginDraft =
  | null
  | { kind: "in-editor" }
  | { kind: "offered"; text: string };

const baseOf = (note: KanjiNoteView | null): NoteBase => ({
  revision: note?.revision ?? 0,
  content: note?.content ?? "",
});

/** `current`, a blank line, then `extra`; either side may be empty. */
const appendDraft = (current: string, extra: string) => {
  if (!extra) return current;
  if (!current) return extra;
  return `${current}\n\n${extra}`;
};

// Plain marker lines around an interrupted draft and the other device's text.
const HELD_DRAFT_MARKER = "====== YOUR DRAFT ======";
const OTHER_DEVICE_MARKER = "====== OTHER DEVICE'S TEXT ======";

/** Whether `held` goes into the editor above other text (not on its own). */
const heldDraftHasCompany = (current: string, held: string) =>
  current !== "" && current !== held;

/**
 * The editor text when an interrupted draft comes back: the draft on top,
 * then the note's current text (what the other device saved), each under a
 * marker line.
 */
const withHeldDraft = (current: string, held: string | null) => {
  if (!held) return current;
  if (!heldDraftHasCompany(current, held)) return held;
  return [HELD_DRAFT_MARKER, held, OTHER_DEVICE_MARKER, current].join("\n\n");
};

/**
 * Edit mode on top of the watched note, with `draft` in the editor. A draft
 * that differs from the note is unsaved until the person edits or saves it.
 */
const startEdit = (note: KanjiNoteView | null, draft: string): NotesState => ({
  mode: "edit",
  session: { base: baseOf(note), draft, sent: null },
});

const leaveForRemoteChange = (kept: string | null): NotesState => ({
  mode: "view",
  kept: kept ? kept : null,
  changedElsewhere: true,
});

/** The draft if it holds text that is not in the note (or sent) yet. */
const unsavedDraft = (session: EditSession) =>
  session.draft !== session.base.content && session.draft !== session.sent
    ? session.draft
    : null;

/**
 * Checks a freshly watched note against the draft's base. Content that is the
 * base or what this tab just sent is ours (possibly with a newer revision once
 * the server acknowledged it), so the base moves onto it and later saves carry
 * that revision. Anything else came from another device.
 */
const reconcile = (
  session: EditSession,
  note: KanjiNoteView | null
): EditSession | "remote" => {
  const { content, revision } = baseOf(note);
  if (content !== session.base.content && content !== session.sent) {
    return "remote";
  }
  if (content === session.base.content && revision === session.base.revision) {
    return session;
  }
  return { ...session, base: { revision, content } };
};

const initialState = (
  note: KanjiNoteView | null,
  storedDraft: string
): NotesState =>
  (note?.content ?? "").length === 0
    ? startEdit(note, storedDraft)
    : { mode: "view", kept: null, changedElsewhere: false };

const LoadedActiveStudyNotes = ({
  kanji,
  api,
  note,
  writeBlocker,
}: {
  kanji: string;
  api: EngineAPI;
  /** Latest watched note: null when never written. */
  note: KanjiNoteView | null;
  writeBlocker: WriteBlocker | null;
}) => {
  const maxBytes = api.notes.notesMaxUtf8Bytes;
  const [state, setState] = useState<NotesState>(() =>
    initialState(note, readNoteDraft(kanji))
  );
  const [loginDraft, setLoginDraft] = useState<LoginDraft>(() => {
    const text = readNoteDraft(kanji);
    if (!text) return null;
    return (note?.content ?? "") === ""
      ? { kind: "in-editor" }
      : { kind: "offered", text };
  });
  const [save, setSave] = useState<ActionStatus>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editing = state.mode === "edit";
  const lock = useNoteEditLock(kanji, editing);

  // Timers and the async save read the newest render's values from here.
  const latest = useRef({ state, note, lock, loginDraft });
  latest.current = { state, note, lock, loginDraft };

  // Another device's edit arrived mid-edit: leave edit mode and keep the
  // draft. Saving it would carry the new revision as its base and could
  // overwrite the incoming edit.
  if (state.mode === "edit" && lock === "held") {
    const next = reconcile(state.session, note);
    if (next === "remote") {
      setState(leaveForRemoteChange(unsavedDraft(state.session)));
    } else if (next !== state.session) {
      setState({ mode: "edit", session: next });
    }
  }

  const cancelTimer = () => {
    if (timer.current == null) return;
    clearTimeout(timer.current);
    timer.current = null;
  };

  const saveDraft = async () => {
    const current = latest.current;
    if (current.state.mode !== "edit" || current.lock !== "held") return;
    const { session } = current.state;
    const text = session.draft;
    if (text === (session.sent ?? session.base.content)) return;
    if (utf8ByteLength(text) > maxBytes) return;

    // Marked as ours before the call: the watch can publish the saved text
    // before save() resolves, and it must not look like another device.
    const previouslySent = session.sent;
    setState((prev) =>
      prev.mode === "edit"
        ? { mode: "edit", session: { ...prev.session, sent: text } }
        : prev
    );
    setSave({ kind: "busy" });
    const result = await api.notes.save({
      kanji,
      content: text,
      expectedRevision: session.base.revision,
    });

    if (result.ok) {
      setSave({ kind: "idle" });
      if (latest.current.loginDraft?.kind === "in-editor") {
        clearNoteDraft(kanji);
        setLoginDraft(null);
      }
      return;
    }
    setState((prev) =>
      prev.mode === "edit" && prev.session.sent === text
        ? { mode: "edit", session: { ...prev.session, sent: previouslySent } }
        : prev
    );
    if (result.error.code === "stale_version") {
      cancelTimer();
      setSave({ kind: "idle" });
      setState(leaveForRemoteChange(text));
      return;
    }
    setSave({ kind: "error", message: copyForCode(result.error.code) });
  };

  const saveNow = () => {
    cancelTimer();
    void saveDraft();
  };

  const scheduleSave = () => {
    cancelTimer();
    timer.current = setTimeout(() => {
      timer.current = null;
      void saveDraft();
    }, SAVE_DELAY_MS);
  };

  // Effect needed: closing the drawer or moving to another kanji unmounts this
  // component while an autosave may still be waiting on its timer. Only an
  // unmount cleanup can send that last edit.
  const flushOnUnmount = useRef(() => {});
  flushOnUnmount.current = () => {
    if (timer.current != null) saveNow();
  };
  useEffect(() => {
    const flush = flushOnUnmount;
    return () => flush.current();
  }, []);

  const handleEditorChange = (value: string) => {
    setState((prev) =>
      prev.mode === "edit"
        ? { mode: "edit", session: { ...prev.session, draft: value } }
        : prev
    );
    scheduleSave();
  };

  const handleModeChange = (mode: NotesMode) => {
    if (mode === state.mode) return;
    if (state.mode === "edit") {
      // Too long to save: stay, so the text isn't dropped on the way out.
      if (utf8ByteLength(state.session.draft) > maxBytes) return;
      saveNow();
      setState({ mode: "view", kept: null, changedElsewhere: false });
      return;
    }
    // An autosave still waiting from the interrupted draft must not save the
    // text this starts with: it stays unsaved until the person edits it.
    cancelTimer();
    setSave({ kind: "idle" });
    setState(startEdit(note, withHeldDraft(note?.content ?? "", state.kept)));
  };

  const discardLoginDraft = () => {
    clearNoteDraft(kanji);
    if (loginDraft?.kind === "in-editor") {
      setState((prev) =>
        prev.mode === "edit"
          ? {
              mode: "edit",
              session: { ...prev.session, draft: prev.session.base.content },
            }
          : prev
      );
    }
    setLoginDraft(null);
  };

  const addLoginDraft = () => {
    if (loginDraft?.kind !== "offered") return;
    cancelTimer();
    setSave({ kind: "idle" });
    setState(
      startEdit(note, appendDraft(note?.content ?? "", loginDraft.text))
    );
    setLoginDraft({ kind: "in-editor" });
  };

  const session = state.mode === "edit" ? state.session : null;
  const isHeld = session != null && lock === "held";
  const draftOverLimit =
    session != null && utf8ByteLength(session.draft) > maxBytes;
  const hasUnsavedChanges =
    isHeld && session.draft !== (session.sent ?? session.base.content);
  const editable = isHeld && writeBlocker == null;
  // Read-only because another tab edits: show that tab's saved text.
  const editorValue =
    session != null && lock !== "unavailable"
      ? session.draft
      : (note?.content ?? "");

  // `openEditor` enters Edit Mode the way the Edit Mode tab does.
  const renderNotices = (openEditor: () => void) => {
    const notices: ReactNode[] = [];
    if (editing && lock === "unavailable") {
      notices.push(
        <UserNotice key="lock" icon="🔒">
          This note is read-only because it&apos;s open for editing in another
          tab. Edit it there, or close that tab to edit it here.
        </UserNotice>
      );
    }
    if (editing && writeBlocker != null) {
      notices.push(
        <UserNotice key="blocker">
          <WriteBlockerCopy blocker={writeBlocker} />
        </UserNotice>
      );
    }
    if (state.mode === "view" && state.changedElsewhere) {
      notices.push(
        <UserNotice key="changed">
          This note changed on another device.{" "}
          {state.kept != null ? (
            <>
              {heldDraftHasCompany(note?.content ?? "", state.kept)
                ? "Your draft is in Edit Mode, above the other device's text."
                : "Your draft is in Edit Mode."}{" "}
              <NoticeAction onClick={openEditor}>Edit note</NoticeAction>
            </>
          ) : null}
        </UserNotice>
      );
    }
    // The banner goes once the person edits: the engine clears the flag when
    // that edit is saved.
    if (note?.hasMergedEdit && !(isHeld && hasUnsavedChanges)) {
      notices.push(
        <UserNotice key="merged" icon="ℹ️">
          Also edited on another device. Both edits are below.
        </UserNotice>
      );
    }
    if (loginDraft?.kind === "in-editor" && isHeld) {
      notices.push(
        <UserNotice key="draft-in-editor">
          Your draft from before you logged in is in the editor. It isn&apos;t
          saved yet. <NoticeAction onClick={saveNow}>Save now</NoticeAction> or{" "}
          <NoticeAction onClick={discardLoginDraft}>discard</NoticeAction> this
          draft.
        </UserNotice>
      );
    }
    if (loginDraft?.kind === "offered") {
      notices.push(
        <UserNotice key="draft-offered">
          You have a draft from before you logged in.{" "}
          <NoticeAction onClick={addLoginDraft}>Add draft to note</NoticeAction>{" "}
          or{" "}
          <NoticeAction onClick={discardLoginDraft}>discard draft</NoticeAction>
          .
        </UserNotice>
      );
    }
    return notices.length > 0 ? notices : null;
  };

  return (
    <StudyNotesPanel
      kanji={kanji}
      mode={state.mode}
      onModeChange={handleModeChange}
      viewSource={note?.content ?? ""}
      notices={renderNotices}
      editor={{
        value: editorValue,
        onChange: handleEditorChange,
        maxBytes,
        disabled: !editable,
        status: (
          <NoteSaveStatus
            overLimit={draftOverLimit}
            save={save}
            hasUnsavedChanges={hasUnsavedChanges}
            syncStatus={note?.status ?? null}
            onSaveNow={saveNow}
          />
        ),
      }}
    />
  );
};

/**
 * Signed-in study note for one kanji (design 5.4, host/guide/NOTES.md). Keeps
 * showing the last note it had if the store goes back to loading (the cache
 * rebuilding), so an open edit isn't thrown away.
 */
export const ActiveStudyNotes = ({
  kanji,
  api,
  writeBlocker,
}: {
  kanji: string;
  api: EngineAPI;
  writeBlocker: WriteBlocker | null;
}) => {
  const snapshot = useEngineQuery(`notes.watch:${kanji}`, (engine) =>
    engine.notes.watch(kanji)
  );
  const [lastKnown, setLastKnown] = useState<{
    note: KanjiNoteView | null;
  } | null>(null);

  const watched = snapshotValue(snapshot);
  const live = snapshot.status === "ready" && snapshot.result.ok;
  if (live && (lastKnown == null || lastKnown.note !== watched)) {
    setLastKnown({ note: watched ?? null });
  }
  const note = live ? (watched ?? null) : lastKnown?.note;

  if (note === undefined) {
    if (snapshot.status === "ready" && !snapshot.result.ok) {
      return (
        <p className="p-3 text-sm text-left">
          {copyForCode(snapshot.result.error.code)}
        </p>
      );
    }
    if (snapshot.status === "failed") {
      return (
        <p className="p-3 text-sm text-left">
          Something went wrong. Try again. ({snapshot.diagnosticId})
        </p>
      );
    }
    return <SectionLoading />;
  }

  return (
    <LoadedActiveStudyNotes
      kanji={kanji}
      api={api}
      note={note}
      writeBlocker={live ? writeBlocker : (writeBlocker ?? "cache_rebuilding")}
    />
  );
};
