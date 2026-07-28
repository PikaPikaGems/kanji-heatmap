# Backend sync contract

Two routes carry every domain — notes, bookmarks, review pile, cards,
settings, activity. One endpoint means one cursor, one queue, and one place
where "did this land" gets answered.

The caller is the engine, not a host app. A host calls `notes.put()` and
`activity.record()`; the engine decides when anything goes over the wire.

```text
GET  /sync/bootstrap    fill an empty cache, one page at a time
POST /sync              push what's queued, pull what's changed
```

Both go out with a Secure HttpOnly session cookie and
`credentials: "include"`. The account is whoever the cookie says — an
account ID in a request body is ignored.

## 1. The two routes

### Shared pieces

```ts
type UnixMs = number;

// How far this device has consumed the account's history. Opaque — store
// it, send it back, never parse it.
type ServerCursor = string;

interface ProtocolVersion {
  major: number; // incompatible change; the engine must refuse rather than guess
  minor: number; // additive; the engine may ignore what it doesn't recognize
}

// One complete row, not a patch. Every one carries an `active` boolean —
// that's how a deletion travels, so there's no tombstone type.
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
  bootstrapPageMaxBytes: number; // most bytes one bootstrap page may be
  rawPracticeEventRetentionDays: number; // how long raw practice events are kept
  rawReviewEventRetentionDays: number | null; // null means the life of the account
}
```

Each `value` is that table's row minus local-only fields — see
[indexdb-tables-and-schemas.md](./indexdb-tables-and-schemas.md).

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
catalogSha256    hash of that catalog; a version string is a claim, a hash is a check
cursor           omit on the first call; otherwise the value from the last page
```

The first call — the one without a `cursor` — starts a run and registers
this device. Every call after walks the same run forward.

```ts
interface BootstrapPageResponse {
  protocol: ProtocolVersion;
  serverTime: UnixMs; // for clock-skew diagnostics; never overwrites local time

  bootstrapId: string; // identifies this run
  snapshotRevision: number; // the account revision this run is a picture of

  device: {
    deviceId: string; // assigned on the first page; send it on every /sync after
    acceptedSequence: number; // 0 for a newly registered device
  };

  entities: readonly ServerEntityChange[]; // this page's rows; one entity is never split
  cursor: ServerCursor | null; // pass back for the next page; null on the last
  hasMore: boolean; // whether another page follows

  policy: PublishedPolicy; // on the first page; may repeat
  entitlementLease?: string; // signed proof the account is paid up, for offline restarts
}
```

Pages are capped by `bootstrapPageMaxBytes` rather than an entity count,
since a long note and a bookmark differ in size by two orders of magnitude.

**How it's used.** Call with no `cursor`; record `bootstrapId`,
`snapshotRevision`, `deviceId`. Create the account database and mark it
`bootstrapping`, which is what keeps a half-filled database unreadable. Loop
while `hasMore`, writing each page's `entities` straight into the live
tables in one transaction and calling again with the returned `cursor`. When
`hasMore` is false, set the local cursor to `snapshotRevision`, mark the
cache active, and `POST /sync` to pick up anything that changed during the
loop.

Two rules: a client that can't fully understand a response must fail loudly
rather than activate a partial account as if it were complete, and an
interrupted bootstrap **restarts** — delete the partial database and begin
again. A cursor is bound to one run and expires with it.

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
  operationId: string; // stable across retries, so a resend isn't applied twice
  deviceSequence: number; // position in this device's single sequence space
  occurredAt: UnixMs; // when the user did it; clamped if implausibly far in the future
}

// One variant per outbox `kind`, each with its own validation. There is no
// generic patch operation.
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

A device never sends a daily summary, a challenge summary, or a canonical
card state. The backend derives all three from the facts above, so there is
no summary operation of any kind.

```ts
interface SyncResponse {
  protocol: ProtocolVersion;
  serverTime: UnixMs;

  acceptedThroughSequence: number; // every outbox row at or below this is done
  cursor: ServerCursor; // the new position, once every group below is applied
  targetRevision: number; // the revision the server selected up to when it answered
  hasMoreChanges: boolean; // true means call again with the new cursor

  changeGroups: readonly ServerChangeGroup[]; // apply in order; never split across responses
  entitlementLease?: string; // refreshed when it was close to expiring
  policy?: PublishedPolicy; // only when a published value changed
  warnings: readonly SyncWarning[]; // accepted, but something needs reconciling
}

interface ServerChangeGroup {
  accountRevision: number; // every row below changed together, as one logical operation
  changes: readonly ServerEntityChange[];
}

type SyncWarning =
  // A pile add lost to another device that added the same kanji with a
  // different word. Reconcile to the canonical word.
  | {
      code: "pile_item_exists";
      operationId: string;
      kanji: string;
      canonicalWord: string;
    }
  // A grade arrived for a pile generation another device removed. It still
  // counts toward the daily summary, but doesn't resurrect the card.
  | { code: "ignored_deleted_generation"; operationId: string; kanji: string }
  // The reported time was implausibly far in the future and was pulled back.
  | { code: "clamped_occurred_at"; operationId: string; clampedTo: UnixMs };
```

**How it's used.** Take the next contiguous batch of `pending` outbox rows
within `syncMaxOperations` and `syncMaxBytes`, mark them `sending`, send
with the current cursor. On success, in **one local transaction**: apply
every change group in revision order, delete outbox rows at or below
`acceptedThroughSequence`, and store the new cursor. A crash before that
commit safely retries from the unchanged cursor. Then go again if
`hasMoreChanges` is true or rows remain.

Three rules that aren't optional:

- Never change a sequence number or `operationId` on retry. A timeout is an
  unknown outcome, not a failure — resend the identical batch.
- Never skip a rejected operation; that punches a gap in a sequence the
  protocol requires to be contiguous. See the last F.A.Q. entry.
- Never apply a change group partially. The cursor advances only through the
  last group fully applied.

Sync runs on startup, on regained connectivity, on visibility after real
inactivity, at the end of a review session, on a settings change, on
debounced study, when the outbox crosses a size threshold, and on explicit
`sync.now()`. Not after every grade — the outbox exists so batching is
possible.

| Status        | Meaning                      | What the engine does                      |
| ------------- | ---------------------------- | ----------------------------------------- |
| `401`         | Session gone                 | Lock account data, move to signed-out     |
| `402`         | Entitlement lapsed           | Read-only; **keep the outbox**            |
| `409`         | Sequence gap or stale device | Lock sync, surface a diagnostic           |
| `413`         | Batch too large              | Shrink future batches; keep the first row |
| `429`         | Rate limited                 | Respect `Retry-After`                     |
| `5xx`/timeout | Server or network trouble    | Backoff with jitter; stay writable        |

Nothing there discards an unacknowledged operation.

Not covered here: authentication (PIN request, verify, logout, session) and
cold-archive retrieval. Both are real routes; neither is part of the sync
loop.

## 2. F.A.Q

**How can a bootstrap spanning several requests produce a consistent
snapshot?**
The run is pinned to `snapshotRevision`, and pages only return rows at or
below it. A row that changes mid-run may be missing from its page — and then
arrives, in its newest form, on the first `/sync` after activation, since
that pull starts from exactly `snapshotRevision`. Nothing has to hold a
database transaction open across HTTP requests.

**Is `POST /sync` paginated?**
Both halves, differently. The push is capped by `syncMaxOperations` and
`syncMaxBytes` — send the next contiguous batch, repeat until the outbox is
empty. The pull is capped by `maxBytes`/`maxChangeGroups` and signalled by
`hasMoreChanges` — repeat with the returned cursor until it's false. No page
numbers, because neither side walks a fixed result set.

**What stops a retry from double-counting a grade or a practice session?**
An operation whose `deviceSequence` is at or below `acceptedThroughSequence`
is skipped before anything is applied, and that high-water mark commits in
the same transaction as the increments it authorized. So resending after a
timeout is exactly as safe as sending once — which is what makes
backend-derived summaries possible at all.

**Why are some problems `warnings` instead of errors?**
All three cases describe an operation that was _accepted_ and produced a
correct result that just isn't the one the device expected. Rejecting them
would create a sequence gap over something that isn't an error. A warning
asks a device to reconcile its guess; it doesn't ask it to retry.

**What happens if the backend permanently rejects one operation?**
Sync locks and a diagnostic surfaces. That's right about not creating a gap
and wrong about everything after: because sequences must be contiguous,
there's no path back, so that device's outbox can never drain. The first
schema bug that reaches production creates permanently stuck devices. Two
fixes are on the table — a user-consented sequence reset that discards the
poisoned operation and resequences the rest, or letting the server
acknowledge-and-ignore a provably unapplyable operation. Neither is
specified yet. This is the largest known hole in this contract.
