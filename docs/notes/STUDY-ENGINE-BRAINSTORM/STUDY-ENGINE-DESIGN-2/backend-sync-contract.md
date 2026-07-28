# Backend sync contract

Two routes carry every domain — notes, bookmarks, review pile, cards,
settings, activity. There is no per-domain endpoint and no separate event
endpoint.

Same caveat as the storage document: unlike the rest of this folder, the
caller here is the **engine**, not a host app. A host calls `notes.put()`
and `activity.record()`; the engine decides when anything goes over the
wire. This is here so "where did my data go, and when" has an answer that
doesn't require reading the implementation.

## 1. The two routes

```text
GET  /sync/bootstrap    fill an empty cache, one page at a time
POST /sync              push what's queued, pull what's changed
```

Both go out with a Secure HttpOnly session cookie and
`credentials: "include"`. The account is whoever the cookie says — an
account ID in a request body is ignored, never trusted.

### Shared pieces

```ts
type UnixMs = number;

// Opaque. Encodes how far this device has consumed the account's history.
// Store it, send it back, never parse it.
type ServerCursor = string;

interface ProtocolVersion {
  major: number; // incompatible change; the engine must refuse rather than guess
  minor: number; // additive; the engine may ignore what it doesn't recognize
}

// A complete canonical row, not a patch. See FAQ.
type ServerEntityChange =
  | { type: "note"; value: CanonicalNote }
  | { type: "bookmark"; value: CanonicalBookmark }
  | { type: "review_pile_item"; value: CanonicalReviewPileItem }
  | { type: "review_card"; value: CanonicalReviewCard }
  | { type: "review_settings"; value: CanonicalReviewSettings }
  | { type: "daily_summary"; value: CanonicalDailySummary }
  | { type: "challenge_summary"; value: CanonicalChallengeSummary };

// Limits the backend publishes and the engine must respect. Sent during
// bootstrap, and again whenever one of them changes.
interface PublishedPolicy {
  policyVersion: string;
  noteMaxUtf8Bytes: number; // maximum size of one saved note edit
  noteMergedMaxUtf8Bytes: number; // storage ceiling after a merge; never shown to a user
  syncMaxOperations: number; // most operations one push may carry
  syncMaxBytes: number; // most bytes one request or response may be
  bootstrapPageMaxBytes: number;
  rawPracticeEventRetentionDays: number;
  rawReviewEventRetentionDays: number | null; // null means the life of the account
}
```

Each `value` is that table's row minus local-only fields — see
[indexdb-tables-and-schemas.md](./indexdb-tables-and-schemas.md). All of
them carry an `active` boolean, which is how a deletion travels. There is no
`tombstone` variant.

### `GET /sync/bootstrap`

Fills an empty local cache: no cache here yet, the user removed it, the
browser evicted it, or a protocol migration forced a reset. Reads and writes
stay blocked until the last page lands.

No request body. Query parameters:

```text
protocolMajor    engine's protocol major
protocolMinor    engine's protocol minor
engineVersion    build identifier, for diagnostics and compatibility gates
applicationId    which host embeds this engine, e.g. "kanji-heatmap"
catalogVersion   which kanji catalog the engine is pinned to
catalogSha256    hash of that catalog — a mismatch is rejected, not merged
cursor           omit on the first call; otherwise the value from the last page
```

The first call — the one without a `cursor` — starts a run and registers
this device. Every call after walks the same run forward.

```ts
interface BootstrapPageResponse {
  protocol: ProtocolVersion;
  serverTime: UnixMs; // clock-skew diagnostics; never overwrites local time

  bootstrapId: string; // identifies this run; useful in a bug report
  snapshotRevision: number; // the account revision this run is a picture of

  device: {
    deviceId: string; // assigned on the first page; store it, send it on every /sync
    acceptedSequence: number; // 0 for a newly registered device
  };

  entities: readonly ServerEntityChange[]; // this page's rows; one entity is never split
  cursor: ServerCursor | null; // pass back for the next page; null on the last
  hasMore: boolean; // mandatory — see FAQ

  policy: PublishedPolicy; // on the first page; may repeat
  entitlementLease?: string; // signed proof the account is paid up, for offline restarts
}
```

Pages are bounded by `bootstrapPageMaxBytes` rather than an entity count,
because a long note and a bookmark differ in size by two orders of
magnitude.

**What the engine does with it.** Call with no `cursor`; record
`bootstrapId`, `snapshotRevision`, `deviceId`. Create the account database
and mark it `bootstrapping` — that gate is what makes a half-filled database
unobservable. Loop while `hasMore`, writing each page's `entities` straight
into the live tables in one transaction and calling again with the returned
`cursor`. When `hasMore` is false, set the local cursor to
`snapshotRevision`, mark the cache active, and immediately `POST /sync` to
pick up anything that changed during the loop.

An interrupted bootstrap **restarts**; it does not resume. Delete the
partial database and begin again. A cursor is bound to one run and expires
with it.

### `POST /sync`

One envelope that pushes queued operations and pulls canonical changes.
Everything after the first bootstrap goes through here.

```ts
interface SyncRequest {
  protocol: ProtocolVersion;
  engineVersion: string;
  applicationId: string;
  catalogVersion: string;
  catalogSha256: string;

  device: { deviceId: string }; // from bootstrap; must match the session's device

  cursor: ServerCursor; // how far this device has already applied

  // null when nothing is queued — a pull-only sync is normal and common.
  push: {
    firstSequence: number; // acceptedThroughSequence + 1, or a retry at or below it
    lastSequence: number; // firstSequence + operations.length - 1
    operations: readonly SyncOperation[]; // ordered by deviceSequence, no gaps
  } | null;

  pull: {
    maxChangeGroups: number; // how many revisions of changes to apply at once
    maxBytes: number; // at or below the published syncMaxBytes
  };
}

interface SyncOperationBase {
  schemaVersion: 1;
  operationId: string; // stable across retries — this is what makes a retry safe
  deviceSequence: number; // position in this device's single sequence space
  occurredAt: UnixMs; // when the user did it; clamped if implausibly far in the future
}

// One variant per outbox `kind`, each with its own validation and
// reduction. There is no generic patch operation.
type SyncOperation =
  // State intents — a desired value, resolved by last-writer-wins or merge
  | NotePutOperation
  | NoteRemoveOperation
  | BookmarkAddOperation
  | BookmarkRemoveOperation
  | ReviewSettingsUpdateOperation
  | ReviewPileAddOperation
  | ReviewPileRemoveOperation
  // Facts — immutable records of something the user did
  | ReviewGradeOperation
  | PracticeActivityEventAddOperation;
```

There is no summary operation of any kind. A device never sends a daily
summary, a challenge summary, or a canonical card state — the backend
derives all three from the facts above.

```ts
interface SyncResponse {
  protocol: ProtocolVersion;
  serverTime: UnixMs;

  acceptedThroughSequence: number; // every outbox row at or below this is done
  cursor: ServerCursor; // the new position — valid only once every group below is applied
  targetRevision: number; // the revision the server was selecting up to when it answered
  hasMoreChanges: boolean; // true means call again immediately with the new cursor

  changeGroups: readonly ServerChangeGroup[]; // apply in order; never split across responses
  entitlementLease?: string; // refreshed when it was close to expiring
  policy?: PublishedPolicy; // only when a published value changed
  warnings: readonly SyncWarning[]; // accepted, but something is worth reconciling
}

interface ServerChangeGroup {
  accountRevision: number; // every row below changed together, as one logical operation
  changes: readonly ServerEntityChange[];
}

type SyncWarning =
  // A pile add lost to another device that added the same kanji with a
  // different word. The canonical word wins; reconcile to it.
  | {
      code: "pile_item_exists";
      operationId: string;
      kanji: string;
      canonicalWord: string;
    }
  // A grade arrived for a pile generation another device removed. It still
  // counts toward the daily summary — the user did the review — but it
  // doesn't resurrect the card.
  | { code: "ignored_deleted_generation"; operationId: string; kanji: string }
  // The reported time was implausibly far in the future and was pulled back.
  | { code: "clamped_occurred_at"; operationId: string; clampedTo: UnixMs };
```

`SyncWarning` is spelled out here because the original documents reference
the type without ever defining it. Three codes cover what the domain rules
actually produce; anything else is an error, not a warning.

**What the engine does with it.** Take the next contiguous batch of
`pending` outbox rows within `syncMaxOperations` and `syncMaxBytes`, mark
them `sending`, send with the current cursor. On success, in **one local
transaction**: apply every change group in revision order, delete outbox
rows at or below `acceptedThroughSequence`, and store the new cursor. A
crash before that commit safely retries from the unchanged cursor. Then go
again if `hasMoreChanges` is true or rows remain.

Three rules that aren't optional:

- **Never change a sequence number or `operationId` on retry.** A timeout is
  an unknown outcome, not a failure — resend the identical batch rather than
  manufacturing new operations.
- **Never skip a rejected operation.** That punches a gap in a sequence the
  protocol requires to be contiguous. See the F.A.Q. — this rule has a known
  unresolved consequence.
- **Never apply a change group partially.** The cursor advances only through
  the last group fully applied.

Sync runs on startup with an active account, on regained connectivity, on
visibility after real inactivity, at the end of a review session, on a
settings change, on debounced study, when the outbox crosses a size
threshold, and on explicit `sync.now()`. Not after every grade — the outbox
exists so batching is possible.

| Status        | Meaning                      | What the engine does                      |
| ------------- | ---------------------------- | ----------------------------------------- |
| `401`         | Session gone                 | Lock account data, move to signed-out     |
| `402`         | Entitlement lapsed           | Read-only; **keep the outbox**            |
| `409`         | Sequence gap or stale device | Lock sync, surface a diagnostic           |
| `413`         | Batch too large              | Shrink future batches; keep the first row |
| `429`         | Rate limited                 | Respect `Retry-After`                     |
| `5xx`/timeout | Server or network trouble    | Backoff with jitter; stay writable        |

Nothing in that table discards an unacknowledged operation. That's the point
of it.

## 2. F.A.Q

**Why only two routes?**
One endpoint means one cursor, one sequence space, one outbox, one backoff,
and one place where "did this land" is answered. Per-domain endpoints would
each need their own version of all of that, and the moment two disagree
about ordering, a note edit and the grade that came after it get applied out
of order.

**Why is starting a bootstrap a `GET` when it registers a device?**
Convenience, and it's the one place this contract bends HTTP convention.
Collapsing "start a run" and "fetch a page" removes a whole call and a whole
response shape, and the side effect is idempotent in practice — registering
an already-registered session returns the existing `deviceId`. Flagging
rather than deciding: if a proxy ever treats this `GET` as replayable in a
way that matters, the fix is a `POST /sync/bootstrap` returning page 0, not
a change to the paging model.

**Why must a client treat `hasMore` as mandatory?**
It's the one bug that silently corrupts an account. A client that doesn't
understand the field, stops after one page, and marks the cache active has
just told the user their account is empty — and every later sync faithfully
keeps it that way. Failing loudly on a response you can't fully consume is
the only safe behavior.

**Is the paging machinery actually needed in v1?**
The mandatory `hasMore` is; the cursor behind it is under review. The
argument for keeping the field and the hard-fail rule from day one is above
and holds. The argument the design review makes is that the expensive half —
a keyset cursor over a fixed domain order with opaque encoding — buys
nothing for an account measured in hundreds of kilobytes, especially since
durable resume is already rejected, and that v1 could require
`hasMore: false` and fail loudly otherwise. This document specifies the full
version because that's what's designed today; noting the open question
rather than quietly settling it.

**How is a bootstrap consistent across several requests if the account can
change in between?**
The run is pinned to `snapshotRevision` and pages only return rows at or
below it. A row that changes mid-run may be missing from its page — and then
arrives, in its newest form, on the first `/sync` after activation, because
that pull starts from exactly `snapshotRevision`. Nothing holds a database
transaction open across HTTP requests.

**Why whole rows instead of patches?**
A row that changed at revisions 11 and 18 only needs its revision-18 state
sent; with patches, both would have to be kept, in order, forever. Whole
rows are why neither side needs a permanent change log — a pull is "current
rows with `serverRevision` above my cursor," and a deletion is a row whose
`active` went false.

**Is `POST /sync` paginated?**
Both halves, differently. The push is bounded by `syncMaxOperations` and
`syncMaxBytes` — send the next contiguous batch, repeat until the outbox is
empty. The pull is bounded by `maxBytes`/`maxChangeGroups` and signalled by
`hasMoreChanges` — repeat with the returned cursor until it's false. Neither
uses page numbers, because neither walks a fixed result set; both are "catch
up until caught up."

**What stops a retry from double-counting a grade or a practice session?**
The high-water mark, and the fact that it commits in the same transaction as
the increments it authorized. An operation whose `deviceSequence` is at or
below `acceptedThroughSequence` is skipped before anything is applied, so
resending after a timeout is exactly as safe as sending once. This is what
makes derived summaries possible at all — without it, "add one to today's
count" couldn't be retried and every device would have to send absolute
snapshots instead.

**What happens if the backend permanently rejects one operation?**
Today: sync locks and a diagnostic surfaces. That's correct about not
creating a gap and wrong about everything after — because sequences must be
contiguous, there's no path back, so that device's outbox can never drain
and the account is stuck until someone intervenes manually. The first schema
bug that reaches production creates permanently stuck devices. The design
review raises this and proposes two ways out: a user-consented sequence
reset that discards the poisoned operation and resequences the rest, or
letting the server acknowledge-and-ignore a provably unapplyable operation
while recording a warning. Neither is specified yet. This is the largest
known hole in this contract, and it's listed here rather than left for
someone to discover during an incident.

**Why do facts travel this route instead of being posted somewhere cheap?**
Because the backend derives card state and summaries from them, so it needs
them inside the sync transaction. Archival happens server-side afterward,
behind a transactional outbox drained at its own pace. The practical result:
a client's obligation ends at the acknowledgement, and an archive backlog is
an operator's problem rather than a status the browser has to model and
retry.

**Why `catalogSha256` and not just `catalogVersion`?**
A version string is a claim; a hash is a check. If two builds ever disagree
about what `kanji-review-v1` contains, the version alone will happily let
them sync review cards keyed to different catalogs. The hash makes that a
refusal at the door.

**Why warnings instead of failing the operation?**
All three cases describe an operation that was _accepted_ and produced a
correct result that just isn't the one the device expected. Rejecting them
would create a sequence gap over something that isn't an error. A warning
asks a device to reconcile its optimistic guess; it doesn't ask it to retry.

**What isn't here?**
Authentication (PIN request, verify, logout, session) and cold-archive
retrieval. Both are real routes; neither is part of the sync loop, and
folding them in would blur the one thing this contract is — how local state
and server state converge.
