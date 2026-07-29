# Bookmark public API

Internal engine/backend mechanics are not here — only what is exposed,
and why each piece exists.

## 1. The public `BookmarksApi`

```ts
// ---- Basic building blocks ----

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

type Result<T> = { ok: true; value: T } | { ok: false; error: BookmarkError };

type BookmarkError =
  | { code: "unsupported_kanji"; kanji: Kanji }
  | { code: "storage_quota" }
  | { code: "read_only" }; // account entitlement has lapsed

// ---- The API itself ----

interface BookmarksApi {
  // A bookmark is set membership, nothing more — see FAQ. true means this
  // kanji is bookmarked.
  watch(kanji: Kanji): QueryStore<boolean>;

  // The complete set. No paging — this is small, account-scoped data, not
  // bounded the way review history could be.
  watchAll(): QueryStore<readonly Kanji[]>;

  add(kanji: Kanji): Promise<Result<void>>;
  remove(kanji: Kanji): Promise<Result<void>>;
}
```

## 2. F.A.Q

**Why does a bookmark store only a kanji, and not the word or anything
else?**
Because a bookmark is set membership, nothing more — "is 日 bookmarked," not
"is 日 bookmarked as 日本." The host already resolves the word, reading,
meaning, and every other display value it needs from its own data. This is
also a concrete bug fix, not just a simplification: today a bookmark is
keyed by kanji **and** word, so when a kanji's representative word changes,
every existing bookmark for it silently stops matching and disappears from
the "bookmarked only" filter — no user action, no way to notice. Keying by
kanji alone removes that failure mode entirely.

**Why is plain last-write-wins fine for bookmarks, when a note needs a merge
story instead?**
Because there's nothing a stale write could lose. A bookmark is a boolean,
resolved by whichever change happened last: if two devices disagree about
whether 日 is bookmarked, the loser's screen quietly updates on next sync,
and nothing is destroyed by that. That's fine _because_ there's no content
to overwrite — contrast this with a note
([notes-public-api.md](./notes-public-api.md)), where blindly letting the
latest write win could silently erase real text someone wrote, which is
exactly why two divergent note edits get joined instead of one overwriting
the other. Neither API makes the host reason about a revision either
way — that merge, like this last-write-wins rule, is handled entirely
inside the engine and backend.

**Is there a conflict UI for bookmarks, like the note merge screen?**
No, and there's nothing for one to do. Two devices disagreeing about a
boolean isn't a conflict in any sense that needs surfacing — nothing is
lost, nothing needs the person's attention, and last-write-wins is already
the correct outcome, not a fallback that settles for it.

**Why do `watch()`/`watchAll()` return plain `boolean`/`Kanji[]`, and
`add()`/`remove()` return `Result<void>`, instead of a `KanjiBookmark`
object carrying `updatedAt`/`serverRevision`?**
An earlier draft carried both fields on every one of these four calls,
mirroring `KanjiNoteView`. Neither had a reader: there's no "recently
bookmarked" screen ordering by `updatedAt`, and no per-write sync-pending
indicator reading `serverRevision`, unlike a note where `hasMergedEdit`/
`mergedAt` do real work. A bookmark has no payload beyond membership, so
`true`/`false` already says everything `watch()` needs to say, and `add()`/
`remove()` have nothing left worth handing back beyond success or a typed
error — whichever screen called them is, in practice, already subscribed to
`watch()` for that same kanji, which reflects the write on its own. The
underlying local row (`KanjiBookmarkRow` in indexdb-tables-and-schemas.md)
still keeps `updatedAt`, `serverRevision`, and `writerDeviceId` — the engine
needs all three internally for last-write-wins tie-breaking. This cut is
the public surface only, not what's tracked underneath.

**Why is there no `BookmarkId`?**
A bookmark has no history to distinguish — it's either on or off for a given
kanji, forever — so, like a note, the kanji itself is already the whole
identity.

**Why doesn't `watchAll()` need pagination?**
It's small, account-scoped data — at most one row per kanji in the entire
catalog — not the kind of thing that grows unboundedly the way, say, review
history could. There's no realistic account with too many bookmarks for one
list.
