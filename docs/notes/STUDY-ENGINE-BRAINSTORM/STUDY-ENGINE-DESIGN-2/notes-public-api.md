# Notes public API

Internal engine/backend mechanics are not here — only what is exposed,
and why each piece exists.

## 1. The public `NotesApi`

```ts
// ---- Basic building blocks ----

type UnixMs = number;
type Kanji = string; // a single kanji character

// ---- Live, reactive reads ----

interface QueryStore<T> {
  getSnapshot(): QuerySnapshot<T>;
  // Call the function this returns to stop listening.
  subscribe(listener: () => void): () => void;
  // Force a re-check now (e.g. a pull-to-refresh button).
  refresh(): Promise<void>;
}

type QuerySnapshot<T> =
  | { status: "loading" }
  | { status: "ready"; result: Result<T> }
  | {
      status: "failed";
      diagnosticId: string; // show this in an error message / bug report
      retryable: boolean; // true: show a Retry button. false: don't bother.
    };

// ---- One-shot calls ----

type Result<T> = { ok: true; value: T } | { ok: false; error: NoteError };

type NoteError =
  | { code: "unsupported_kanji"; kanji: Kanji }
  // The host should never actually see this in practice — it should check
  // content against maxUtf8Bytes live, as the person types, and keep
  // save() from ever being called over the limit. Only covers an over-limit
  // save; a trimmed-empty save is valid (it deletes the note — see FAQ) and
  // never hits this.
  | { code: "validation_failed" }
  | { code: "storage_quota" }
  | { code: "read_only" }; // account entitlement has lapsed

// ---- The note itself ----

// One canonical note exists per kanji. See FAQ for what happens when two
// devices edit it at the same time — nothing here is a "pick a winner" flow.
interface KanjiNoteView {
  readonly kanji: Kanji;
  // Never empty — a trimmed-empty save deletes the note instead of
  // producing a view. See FAQ.
  readonly content: string;
  readonly updatedAt: UnixMs;
  // True while this kanji has a save sitting in the local outbox that the
  // server hasn't acknowledged yet. Flips to false the moment sync
  // confirms it, no host action needed. See FAQ.
  readonly hasPendingSync: boolean;
  // True when the backend merged a divergent edit from another device into
  // `content`. `content` can be over `maxUtf8Bytes` when this is true — the
  // same over-limit handling as any long note applies, not a bare length
  // error. See FAQ.
  readonly hasMergedEdit: boolean;
  readonly mergedAt?: UnixMs; // set only alongside hasMergedEdit
}

interface SaveNoteInput {
  kanji: Kanji;
  // Trimmed-empty content deletes the note. See FAQ.
  content: string;
}

// ---- The API itself ----

interface NotesApi {
  // The maximum UTF-8 byte size of one saved edit. Fixed for the life of the
  // engine session. Check it live against `content` as the person types —
  // `new TextEncoder().encode(content).length` — not just at save time.
  readonly maxUtf8Bytes: number;

  // null means this kanji has no active note.
  watch(kanji: Kanji): QueryStore<KanjiNoteView | null>;

  // Trimmed-empty content deletes the note — `value` comes back `null`.
  // Otherwise `value` is the saved KanjiNoteView. This is the only write:
  // there's no separate remove(), because the UI has no delete affordance
  // either — clearing the text and letting autosave fire *is* how a note
  // gets deleted. See FAQ.
  save(input: SaveNoteInput): Promise<Result<KanjiNoteView | null>>;
}
```

## 2. F.A.Q

**How do note conflicts actually get resolved?**
They don't, in the sense of picking a winner — but only among two genuine
edits. When two devices each save non-empty, divergent content for the same
note while offline, the backend joins both texts into one canonical note,
separated by a rule and an invisible marker, ordered so every device that
applies the same pair produces byte-identical output. Nothing is discarded
and nothing needs restoring — which is also why there's no conflict list, no
`restoreConflict`/`dismissConflict`, and no separate conflict-review screen
anywhere in this API. `hasMergedEdit` and `mergedAt` are the entire signal;
see the next question for what to do with them. A delete (a trimmed-empty
save) on one side racing a real edit on the other isn't this kind of
divergence at all — see "Does clearing a note ever race with an edit?"
below for that case.

**What should the host actually do when `hasMergedEdit` is true?**
Render the note as normal — the merged content, separator included, is
genuinely the note now — and show something like "Also edited on another
device. Both edits are below." No merge-specific save gating is needed
beyond what already applies to every note: if the merge pushed `content`
over `maxUtf8Bytes`, the same live length check and `validation_failed`
path that guards any long note keeps autosave from firing until it's
trimmed — there's no separate "paused" state to introduce. `hasMergedEdit`
itself only flips to false once an edit actually saves, but the host
doesn't need to wait for that: it's fine to drop the banner locally as soon
as the person starts typing, since a refresh before that first save lands
would just show the same merged note and banner again — which is still the
correct thing to show.

**What should the host do if another device's edit arrives while someone is
actively editing, not just viewing?**
If the host has a separate edit mode and view mode, the safe pattern is to
drop back to view mode the moment `watch()` delivers content that differs
from what the open draft started from, rather than trying to reconcile a
draft that's still being typed into. Show a banner explaining why — "This
note was edited elsewhere. Edit to see both versions." — and hold the
interrupted draft in memory (ordinary host-side state, nothing
engine-related) instead of discarding it. Re-entering edit mode pre-fills
the textarea with that held draft plus the current content, concatenated;
from there it's a normal edit — trim, autosave, done, merging exactly like
any other divergent edit.

This has to go through a mode switch rather than resolving on the spot
because of timing: by the time `watch()` has something new to deliver, the
engine's local copy of the note has already moved past whatever the open
draft was based on. A save fired right then — even an automatic,
well-intentioned one — would report the new, current revision as its base
and look like an uncontested edit to the backend, silently overwriting the
other device's text instead of merging with it (see "How do note conflicts
actually get resolved?" above). Routing through view mode first is what
prevents that: nothing can be saved until the person has consciously looked
at the current content again, so whatever they eventually save is always
genuinely built on it — no revision-tracking required on the host's part.
It also needs no new engine method: the host already holds both sides of
the comparison — its own draft, and whatever `watch()` last delivered —
without the engine ever needing to know an edit is in progress.

One honest gap: if the person abandons view mode without ever going back to
edit — closes the tab, navigates away — the held draft was only ever in
memory, so it's gone. Same as any unsaved text in any app; nothing specific
to this design.

**Why does merging, rather than keeping a separate "losing copy," make
sense?**
A recoverable losing copy only actually gets recovered if the person finds
it, and a copy attached to a kanji they don't reopen again is never found.
Putting both edits where they're already looking — right in the editor —
also removes an entire domain: no conflicts table, no archival write for
the losing text, and, worth calling out on its own, no note content ever has
to leave the live database at all. That matters more here than it would
elsewhere, since notes are the most personal text this API stores.

**Why does a trimmed-empty save delete the note, instead of being
rejected?**
Because the UI has no delete button — autosave is the only write path a
person has. If empty content were invalid, there'd be no way to remove a
note at all short of leaving it around forever. So `save()` treats
trimmed-empty content as the delete: it's what "the person cleared the box"
already means in an autosave-only editor. This is also why there's no
separate `remove()` — it would just be `save()` with a size check bolted on.

**Does clearing a note ever race with an edit?**
Yes, and the edit always wins: if a note is cleared (a trimmed-empty save)
on one device while it's edited on another, the edited version stays
active. This isn't a merge — an empty save has no content to join with the
other side, so there's nothing to do but keep the real edit. Losing a clear
is recoverable (clear it again); losing text silently would not be. The
device that cleared it just sees the note reappear next time it syncs —
there's no error for this, because the local `save()` call did succeed (it
returned `null` locally, same as any delete). The note just didn't stay
gone.

**Why doesn't `save()` take an expected revision, the way a review card's
grade carries `expectedRevision`?**
Because there's no way for a note save to be meaningfully rejected in the
first place — every non-empty divergence gets merged, never refused (see
`NoteSaveOperation.baseServerRevision` in backend-sync-contract.md). A
`DueCard`'s `expectedRevision` exists because grading against the wrong
card state is a real error worth failing loud for; nothing analogous exists
for a note, since two texts can always be joined into one canonical result.
The engine still tracks each note's `serverRevision` internally, purely as
bookkeeping for that merge — it's not something a host needs to read back
and resupply in order to save correctly, so it isn't part of
`SaveNoteInput`. It isn't part of `KanjiNoteView` either; see the next
question for the one sync-state signal a host actually gets.

**Why `hasPendingSync` instead of exposing `serverRevision`?**
`serverRevision` used to sit on `KanjiNoteView` for roughly this reason, but
it didn't actually work: it flips from `undefined` to a number the first
time a note syncs and then stays a number forever after, so the most it
could ever say is "has this note reached the server at least once," never
"is what's in front of me saved right now" — which is the thing worth
telling a person. `hasPendingSync` says that directly: true whenever this
kanji has a save sitting in the local outbox the server hasn't acknowledged
yet, false the instant it's confirmed. A small "Saving…" / "Saved" label
near the editor is enough, and it needs no host action beyond rendering
whatever `watch()` currently reports. It's a plain boolean rather than a
richer status (`"pending" | "sending" | "failed"`, say) because the engine
already retries a stuck send with backoff on its own — see
backend-sync-contract.md's sync status table — so there's nothing for a
host to do differently between "queued" and "currently sending," and a sync
failure serious enough to need a person's attention (a `409` lock, say) is
an account-wide condition, not a per-note one, so it belongs in a separate,
account-level diagnostic, not on every note's view.

**Why doesn't `KanjiNoteView` have an `active` or `exists` flag?**
Because `watch()` already tells you that: no active note for this kanji
comes back as `null` — whether it was never created or was deleted by a
trimmed-empty save. A field that's always `true` on everything you can
actually see wouldn't add anything.

**Why is there no `NoteId`, the way reviews have an opaque `CardId`?**
Because a note doesn't need one. `CardId` exists to tell apart different
"attempts" at the same kanji after a review card is removed and re-added. A
note has no such history — there's exactly one canonical note per kanji,
ever — so the kanji itself is already a stable, sufficient key.

**Why is there only one size number here (`maxUtf8Bytes`), and not also the
absolute merge ceiling?**
Because the host never needs the ceiling. It exists purely so that two or
three divergent edits merging together can't grow the stored note forever;
once it's hit, the backend silently truncates and that's the end of it — no
warning code, no banner, no host UI, on purpose. The only number a host ever
acts on is the one edit limit that applies to every save.

**Why is there no `notes.watchAll()` or `watchMany()`, the way bookmarks and
reviews have bulk reads?**
Nothing needs it today. The review heatmap needs every card at once, and a
"bookmarked only" filter needs the whole bookmark set, but nothing shows
"every note in the collection" on one screen — a note is read one kanji at a
time, from the one editor that's open for it. If a future screen needs to
show which kanji have notes at all, that's a `watchMany` worth adding then,
not before.
