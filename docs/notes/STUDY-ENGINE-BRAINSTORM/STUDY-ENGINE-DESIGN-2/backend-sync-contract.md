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

  // Both are null: raw practice and review events are kept for the life of
  // the account. Nullable rather than absent so a limit could be published
  // later without a protocol change.
  rawPracticeEventRetentionDays: number | null;
  rawReviewEventRetentionDays: number | null;
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
engineVersion    build identifier; the server gates incompatible builds on it
applicationId    which host embeds this engine, e.g. "kanji-heatmap"; allowlisted
catalogSha256    hash of the kanji catalog the engine is pinned to
cursor           omit on the first call; otherwise nextCursor from the last page
```

The first call — the one without a `cursor` — starts a run and registers
this device. Every call after walks the same run forward.

```ts
interface BootstrapPageResponse {
  protocol: ProtocolVersion;
  serverTime: UnixMs; // for clock-skew diagnostics; never overwrites local time

  snapshotRevision: number; // the account revision this run is a picture of
  deviceId: string; // assigned on the first page; send it on every /sync after

  entities: readonly ServerEntityChange[]; // this page's rows; one entity is never split
  nextCursor: ServerCursor | null; // pass back for the next page; null means that was the last

  policy: PublishedPolicy; // on the first page; may repeat
  entitlementLease?: string; // signed proof the account is paid up, for offline restarts
}
```

Pages are capped by `bootstrapPageMaxBytes` rather than an entity count,
since a long note and a bookmark differ in size by two orders of magnitude.

**How it's used.** Call with no `cursor`; record `snapshotRevision` and
`deviceId`. Create the account database and mark it `bootstrapping`, which
is what keeps a half-filled database unreadable. Loop while `nextCursor`
isn't null, writing each page's `entities` straight into the live tables in
one transaction and calling again with it. When it comes back null, set the
local cursor to `snapshotRevision`, mark the cache active, and `POST /sync`
to pick up anything that changed during the loop.

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
  catalogSha256: string;

  deviceId: string; // from bootstrap; must match the session's registered device

  cursor: ServerCursor; // how far this device has already applied

  // Empty when nothing is queued — a pull-only sync is normal and common.
  // Ordered by deviceSequence, contiguous, starting at
  // acceptedThroughSequence + 1 or resending a batch at or below it.
  push: readonly SyncOperation[];

  maxPullBytes: number; // how large a response this device will accept; <= syncMaxBytes
}

interface SyncOperationBase {
  deviceSequence: number; // position in this device's single sequence space; identifies the operation
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
  cursor: ServerCursor; // the new position, once every change below is applied
  hasMoreChanges: boolean; // true means call again with the new cursor

  changes: readonly ServerEntityChange[]; // apply all of them, in order, or none
  entitlementLease?: string; // refreshed when it was close to expiring
  policy?: PublishedPolicy; // only when a published value changed
  warnings: readonly SyncWarning[]; // accepted, but something needs reconciling
}

type SyncWarning =
  // A pile add lost to another device that added the same kanji with a
  // different word. Reconcile to the canonical word.
  | {
      code: "pile_item_exists";
      deviceSequence: number;
      kanji: string;
      canonicalWord: string;
    }
  // A grade arrived for a pile generation another device removed. It still
  // counts toward the daily summary, but doesn't resurrect the card.
  | {
      code: "ignored_deleted_generation";
      deviceSequence: number;
      kanji: string;
    }
  // The reported time was implausibly far in the future and was pulled back.
  | { code: "clamped_occurred_at"; deviceSequence: number; clampedTo: UnixMs };
```

**How it's used.** Take the next contiguous batch of `pending` outbox rows
within `syncMaxOperations` and `syncMaxBytes`, mark them `sending`, send
with the current cursor. On success, in **one local transaction**: apply
every change in order, delete outbox rows at or below
`acceptedThroughSequence`, and store the new cursor. A crash before that
commit safely retries from the unchanged cursor. Then go again if
`hasMoreChanges` is true or rows remain.

Three rules that aren't optional:

- Never renumber an operation on retry. A timeout is an unknown outcome, not
  a failure — resend the identical batch with the identical sequences.
- Never skip a rejected operation; that punches a gap in a sequence the
  protocol requires to be contiguous. See the last F.A.Q. entry.
- Never apply a response partially. The cursor is only valid once every
  change that came with it has been written.

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
empty. The pull is capped by `maxPullBytes` and signalled by
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

**Fields you might expect here that aren't.**
Each was cut because something else in the same payload already carries it,
or because nothing reads it. The trade-off is the same in most cases: the
server has to derive a value instead of being handed it, and loses the
chance to cross-check two fields against each other — but a cross-check
that can fail is itself a failure mode, and one that only exists because
the value was sent twice.

| Cut                                 | Why                                                                                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `push.firstSequence`/`lastSequence` | They're the first and last `deviceSequence` in `push`. Trade-off: the server can no longer reject a batch by its range before parsing the array — but body size is already checked before decoding.                                                                                        |
| `operationId`                       | It was `(deviceId, deviceSequence)`, and both are already in the request. `deviceSequence` alone identifies an operation within a device, which is the only scope that matters.                                                                                                            |
| `catalogVersion`                    | `catalogSha256` identifies the catalog exactly. Trade-off: the server looks the readable name up from the hash for its own error messages instead of being told it.                                                                                                                        |
| `bootstrapId`                       | Nothing read it. The cursor already binds a page to its run. Trade-off: one less thing to quote in a bug report; the account revision and device ID still identify the run.                                                                                                                |
| `hasMore` (bootstrap)               | Folded into `nextCursor: ServerCursor \| null`. Trade-off: this was deliberately an explicit, mandatory field so a client couldn't quietly activate a partial account — that rule now attaches to `nextCursor`, which is harder to ignore, since you can't page at all without reading it. |
| `device.acceptedSequence`           | Bootstrap only runs for an empty cache, so it was always `0`.                                                                                                                                                                                                                              |
| `targetRevision`                    | Nothing read it. The client loops on `hasMoreChanges` and stores the opaque cursor; the server's internal selection bound isn't its business.                                                                                                                                              |
| `pull.maxChangeGroups`              | `maxPullBytes` already bounds the response. Two knobs for one limit meant an undefined answer when they disagreed.                                                                                                                                                                         |
| `schemaVersion` on each operation   | The host never chooses it and the engine build already fixes it. An incompatible shape change arrives as a new operation variant, which is the rule `activity-public-api.md` already settled on.                                                                                           |

`engineVersion` and `applicationId` stay, because the server genuinely
branches on both — one gates incompatible builds, the other is allowlisted.
`snapshotRevision` stays too: it's what the local cursor is set to when
bootstrap finishes, so cutting it would just mean adding a replacement.

**Why is `changes` a flat list instead of groups of changes per revision?**
Because grouping only helps a client that stops partway, and nothing here
does. A response is bounded by `maxPullBytes`, read fully into memory, and
applied in one transaction — all of it or none. The trade-off is that
"these three rows changed as one logical operation" is no longer visible in
the response. Nothing consumed that today, and the atomicity it was meant to
protect is provided by the single transaction instead. If a future client
ever does need to apply a huge pull in chunks, the grouping has to come
back — that's the one thing this makes harder.

**What happens if the backend permanently rejects one operation?**
Sync locks and a diagnostic surfaces. That's right about not creating a gap
and wrong about everything after: because sequences must be contiguous,
there's no path back, so that device's outbox can never drain. The first
schema bug that reaches production creates permanently stuck devices. Two
fixes are on the table — a user-consented sequence reset that discards the
poisoned operation and resequences the rest, or letting the server
acknowledge-and-ignore a provably unapplyable operation. Neither is
specified yet. This is the largest known hole in this contract.
