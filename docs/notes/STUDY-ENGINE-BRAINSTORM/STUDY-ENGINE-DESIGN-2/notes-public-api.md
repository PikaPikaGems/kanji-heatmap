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
  // The host should never actually see this in practice — it should catch
  // both cases itself before calling put(). Covers an empty (after trim)
  // save, and a save over maxUtf8Bytes.
  | { code: "validation_failed" }
  | { code: "stale_revision" } // expectedServerRevision was given, and the note has since moved on
  | { code: "storage_quota" }
  | { code: "read_only" }; // account entitlement has lapsed

// ---- The note itself ----

// One canonical note exists per kanji. See FAQ for what happens when two
// devices edit it at the same time — nothing here is a "pick a winner" flow.
interface KanjiNoteView {
  readonly kanji: Kanji;
  readonly content: string; // never empty — put() rejects blank saves; remove() deletes instead
  readonly updatedAt: UnixMs;
  // Undefined until this note has synced to the server at least once.
  readonly serverRevision?: number;
  // True when the backend merged a divergent edit from another device into
  // `content`. `content` can be over `maxUtf8Bytes` when this is true —
  // render an over-limit editor with a disabled save, not a bare length
  // error. See FAQ.
  readonly hasMergedEdit: boolean;
  readonly mergedAt?: UnixMs; // set only alongside hasMergedEdit
}

interface PutNoteInput {
  kanji: Kanji;
  content: string;
  // Omit for a brand-new note, or one that's never synced yet. Otherwise,
  // the serverRevision this edit was read at, so the engine can tell if the
  // note changed elsewhere since.
  expectedServerRevision?: number;
}

interface RemoveNoteInput {
  kanji: Kanji;
  expectedServerRevision?: number;
}

// ---- The API itself ----

interface NotesApi {
  // The maximum UTF-8 byte size of one saved edit. Fixed for the life of the
  // engine session. Check it live against `content` as the person types —
  // `new TextEncoder().encode(content).length` — not just at save time.
  readonly maxUtf8Bytes: number;

  // null means this kanji has no active note.
  watch(kanji: Kanji): QueryStore<KanjiNoteView | null>;

  put(input: PutNoteInput): Promise<Result<KanjiNoteView>>;
  remove(input: RemoveNoteInput): Promise<Result<void>>;
}
```

## 2. F.A.Q

**How do note conflicts actually get resolved?**
They don't, in the sense of picking a winner. When two devices edit the same
note while offline and their edits diverge, the backend joins both texts into
one canonical note, separated by a rule and an invisible marker, ordered so
every device that applies the same pair produces byte-identical output.
Nothing is discarded and nothing needs restoring — which is also why there's
no conflict list, no `restoreConflict`/`dismissConflict`, and no separate
conflict-review screen anywhere in this API. `hasMergedEdit` and `mergedAt`
are the entire signal; see the next question for what to do with them.

**What should the host actually do when `hasMergedEdit` is true?**
Render the note as normal — the merged content, separator included, is
genuinely the note now — but disable Save and explain why, rather than
showing a bare "too long" error: something like "Also edited on another
device. Both edits are below — trim to fit to save." `maxUtf8Bytes` still
applies to a merged note with no exception, so the over-limit editor *is*
the resolution flow. The person deletes the half they don't want and saves
normally, which clears `hasMergedEdit` on that same save.

**Why does merging, rather than keeping a separate "losing copy," make
sense?**
A recoverable losing copy only actually gets recovered if the person finds
it, and a copy attached to a kanji they don't reopen again is never found.
Putting both edits where they're already looking — right in the editor —
also removes an entire domain: no conflicts table, no archival write for
the losing text, and, worth calling out on its own, no note content ever has
to leave the live database at all. That matters more here than it would
elsewhere, since notes are the most personal text this API stores.

**Does removing a note ever race with an edit?**
Yes, and the edit always wins: if a note is deleted on one device while it's
edited on another, the edited version stays active. Losing a delete is
recoverable (delete it again); losing text silently would not be. The device
that deleted it just sees the note reappear next time it syncs — there's no
error for this, because the local `remove()` call did succeed. The note just
didn't stay gone.

**Why is `expectedServerRevision` optional, unlike a review card's
`revision`/`expectedRevision`?**
Because a note might not have one yet. A `DueCard` always already exists on
the server before a host ever sees it, but a brand-new note — or one written
entirely offline — has never synced, so there's nothing yet to compare
against. Pass it when you have it (you read the note before editing it);
omit it for a note you know is new.

**Why doesn't `KanjiNoteView` have an `active` or `exists` flag?**
Because `watch()` already tells you that: no active note for this kanji
comes back as `null`. A field that's always `true` on everything you can
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
