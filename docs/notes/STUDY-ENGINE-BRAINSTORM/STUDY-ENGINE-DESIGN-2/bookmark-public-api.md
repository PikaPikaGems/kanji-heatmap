# Bookmark public API

Internal engine/backend mechanics are not here — only what is exposed,
and why each piece exists.

## 1. The public `BookmarksApi`

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

type Result<T> = { ok: true; value: T } | { ok: false; error: BookmarkError };

type BookmarkError =
  | { code: "unsupported_kanji"; kanji: Kanji }
  | { code: "storage_quota" }
  | { code: "read_only" }; // account entitlement has lapsed

// ---- The bookmark itself ----

// A bookmark is set membership for one kanji, nothing more. See FAQ for why
// it carries no word.
interface KanjiBookmark {
  readonly kanji: Kanji;
  readonly updatedAt: UnixMs;
  readonly serverRevision?: number; // undefined until this bookmark has synced at least once
}

// ---- The API itself ----

interface BookmarksApi {
  // null means this kanji isn't bookmarked.
  watch(kanji: Kanji): QueryStore<KanjiBookmark | null>;

  // The complete set. No paging — this is small, account-scoped data, not
  // bounded the way review history could be.
  watchAll(): QueryStore<readonly KanjiBookmark[]>;

  add(kanji: Kanji): Promise<Result<KanjiBookmark>>;
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

**Why don't `add`/`remove` take a revision, the way a note's `put` takes
`expectedServerRevision`?**
Because there's nothing a stale write could lose. A bookmark is a boolean,
resolved by plain last-write-wins: if two devices disagree about whether 日
is bookmarked, whichever change happened last simply wins, and the loser's
screen quietly updates on next sync. That's fine _because_ there's no
content to overwrite — contrast this with a note
([notes-public-api.md](./notes-public-api.md)), where blindly letting the
latest write win could silently erase real text someone wrote. That's
exactly why notes need a revision check and a merge story, and bookmarks
need neither.

**Is there a conflict UI for bookmarks, like the note merge screen?**
No, and there's nothing for one to do. Two devices disagreeing about a
boolean isn't a conflict in any sense that needs surfacing — nothing is
lost, nothing needs the person's attention, and last-write-wins is already
the correct outcome, not a fallback that settles for it.

**Why doesn't `KanjiBookmark` have an `active` flag?**
Same reason as a note: `watch(kanji)` returning `null` already means "not
bookmarked," and an item present in `watchAll()`'s list is, by definition,
active. A flag that's always `true` on everything you can actually see
wouldn't tell you anything.

**Why is there no `BookmarkId`?**
A bookmark has no history to distinguish — it's either on or off for a given
kanji, forever — so, like a note, the kanji itself is already the whole
identity.

**Why doesn't `watchAll()` need pagination?**
It's small, account-scoped data — at most one row per kanji in the entire
catalog — not the kind of thing that grows unboundedly the way, say, review
history could. There's no realistic account with too many bookmarks for one
list.
