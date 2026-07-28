# Backend sync contract

Two HTTP routes carry every domain — notes, bookmarks, review pile, cards,
settings, and activity. There is no per-domain endpoint and no separate
event endpoint.

The consumer here is the **engine**, not the host app. A host never calls
these routes; it calls `notes.put()` and `activity.record()` and the engine
decides when anything goes over the wire. This document exists so that
"where did my data go, and when" has an answer that doesn't require reading
the implementation.

```text
GET  /sync/bootstrap    fill an empty cache, one page at a time
POST /sync              push what's queued, pull what's changed
```

Both are called with a Secure HttpOnly session cookie and
`credentials: "include"`. The account is whoever the cookie says it is — an
account ID in a request body is ignored, never trusted.

## 1. Shared building blocks

```ts
type UnixMs = number;

// Opaque to the client. Encodes how far this device has consumed the
// account's change history. Store it, send it back, never parse it.
type ServerCursor = string;

// Every response carries this. A mismatch the engine can't handle moves the
// account to read-only rather than guessing.
interface ProtocolVersion {
  major: number; // incompatible change; engine must refuse
  minor: number; // additive change; engine may ignore what it doesn't know
}

// A complete canonical row, not a patch. See F.A.Q.
type ServerEntityChange =
  | { type: "note"; value: CanonicalNote }
  | { type: "bookmark"; value: CanonicalBookmark }
  | { type: "review_pile_item"; value: CanonicalReviewPileItem }
  | { type: "review_card"; value: CanonicalReviewCard }
  | { type: "review_settings"; value: CanonicalReviewSettings }
  | { type: "daily_summary"; value: CanonicalDailySummary }
  | { type: "challenge_summary"; value: CanonicalChallengeSummary };
```

Each `value` is the stored row for that table, minus local-only fields —
see [indexdb-tables-and-schemas.md](./indexdb-tables-and-schemas.md). Every
one of them carries an `active` boolean, which is how a deletion travels.
There is no `tombstone` variant.

```ts
// Limits the backend publishes and the engine must respect. Sent on
// bootstrap and again on any /sync response where a value changed.
interface PublishedPolicy {
  policyVersion: string;
  noteMaxUtf8Bytes: number; // maximum size of one saved note edit
  noteMergedMaxUtf8Bytes: number; // storage ceiling after a merge; not a host-facing number
  syncMaxOperations: number; // most operations one push may contain
  syncMaxBytes: number; // most bytes one request or response may be
  bootstrapPageMaxBytes: number; // most bytes one bootstrap page may be
  rawPracticeEventRetentionDays: number;
  rawReviewEventRetentionDays: number | null; // null means "kept for the life of the account"
}
```

## 2. `GET /sync/bootstrap`

Fills an empty local cache. Required when the account has no cache here,
the user removed it, the browser evicted it, or a protocol migration forced
a reset. Reads and writes stay blocked until the last page lands.

### Request

No body. Query parameters:

```text
protocolMajor    engine's protocol major
protocolMinor    engine's protocol minor
engineVersion    build identifier, for diagnostics and compatibility gates
applicationId    which host embeds this engine, e.g. "kanji-heatmap"
catalogVersion   which kanji catalog the engine is pinned to
catalogSha256    hash of that catalog; a mismatch is rejected, not merged
cursor           omit on the first call; otherwise the value from the previous page
```

The first call — the one without a `cursor` — starts a run and registers
this device. Every call after it just walks the same run forward.

### Response

```ts
interface BootstrapPageResponse {
  protocol: ProtocolVersion;
  serverTime: UnixMs; // for clock-skew diagnostics; never used to overwrite local time

  bootstrapId: string; // identifies this run; useful in a bug report
  snapshotRevision: number; // the account revision this run is a picture of

  device: {
    deviceId: string; // assigned on the first page; store it, send it on every /sync
    acceptedSequence: number; // 0 for a newly registered device
  };

  entities: readonly ServerEntityChange[]; // this page's rows; never splits one entity across pages
  cursor: ServerCursor | null; // pass back for the next page; null on the last one
  hasMore: boolean; // false means this was the last page — see F.A.Q., this field is mandatory

  policy: PublishedPolicy; // on the first page; may repeat
  entitlementLease?: string; // signed proof the account is paid up, for offline restarts
}
```

The response is bounded by `bootstrapPageMaxBytes` rather than an entity
count, because a long note and a bookmark differ in size by two orders of
magnitude.

### What a consumer does with it

1. Call with no `cursor`. Record `bootstrapId`, `snapshotRevision`, and
   `deviceId`.
2. Create the account database and mark it `bootstrapping` — this gate is
   what makes a half-filled database unobservable.
3. Loop while `hasMore`: write each page's `entities` straight into the live
   tables in one transaction, then call again with the returned `cursor`.
4. When `hasMore` is false, set the local cursor to `snapshotRevision` and
   mark the cache active.
5. Immediately `POST /sync` to pick up anything that changed during the
   loop.

An interrupted bootstrap **restarts**; it does not resume. Delete the
partial database and begin a new run. A cursor is bound to one run and
expires with it.

## 3. `POST /sync`

One envelope that pushes queued operations and pulls canonical changes.
Everything after the first bootstrap goes through here.

### Request body

```ts
interface SyncRequest {
  protocol: ProtocolVersion;
  engineVersion: string;
  applicationId: string;
  catalogVersion: string;
  catalogSha256: string;

  device: { deviceId: string }; // from bootstrap; must match the session's registered device

  cursor: ServerCursor; // how far this device has already applied

  // null when there's nothing queued — a pull-only sync is normal and common.
  push: {
    firstSequence: number; // must be acceptedThroughSequence + 1, or a retry at or below it
    lastSequence: number; // must equal firstSequence + operations.length - 1
    operations: readonly SyncOperation[]; // ordered by deviceSequence, no gaps
  } | null;

  pull: {
    maxChangeGroups: number; // how many revisions of changes the engine is willing to apply at once
    maxBytes: number; // at or below the published syncMaxBytes
  };
}

interface SyncOperationBase {
  schemaVersion: 1;
  operationId: string; // stable across retries; this is what makes a retry safe
  deviceSequence: number; // position in this device's single sequence space
  occurredAt: UnixMs; // when the user did it locally; clamped if implausibly far in the future
}

// One variant per outbox `kind`, each with its own validation and reduction.
// There is no generic patch operation.
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

### Response body

```ts
interface SyncResponse {
  protocol: ProtocolVersion;
  serverTime: UnixMs;

  acceptedThroughSequence: number; // every outbox row at or below this is done; delete them
  cursor: ServerCursor; // the new position, valid only after every group below is applied
  targetRevision: number; // the revision the server was selecting up to when it answered
  hasMoreChanges: boolean; // true means call again immediately with the new cursor

  changeGroups: readonly ServerChangeGroup[]; // apply in order; never split across responses
  entitlementLease?: string; // refreshed when it was close to expiring
  policy?: PublishedPolicy; // present only when a published value changed
  warnings: readonly SyncWarning[]; // accepted, but something is worth telling the user
}

interface ServerChangeGroup {
  accountRevision: number; // all rows below changed together, as one logical operation
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
  // counts toward the daily summary — the user did the review — but it does
  // not resurrect the card.
  | { code: "ignored_deleted_generation"; operationId: string; kanji: string }
  // The reported time was implausibly far in the future and was pulled back.
  | { code: "clamped_occurred_at"; operationId: string; clampedTo: UnixMs };
```

`SyncWarning` is spelled out here because the denser design references the
type without ever defining it. Three codes cover what the domain rules
actually produce; anything else is an error, not a warning.

### What a consumer does with it

Per sync attempt:

1. Take the next contiguous batch of `pending` outbox rows, within
   `syncMaxOperations` and `syncMaxBytes`. Mark them `sending`. Send with
   the current cursor.
2. On success, in **one local transaction**: apply every change group in
   revision order, delete outbox rows at or below `acceptedThroughSequence`,
   and store the new cursor. A crash before that commit safely retries from
   the unchanged cursor.
3. If `hasMoreChanges` is true, go again right away with the new cursor.
4. If outbox rows remain, go again.

Rules that are not optional:

- **Never reuse a sequence number for different content, and never change
  one on retry.** A timeout is an unknown outcome, not a failure — resend
  the identical batch with the identical `operationId`s rather than
  manufacturing new ones.
- **Never skip a rejected operation.** Doing so punches a gap in a sequence
  the protocol requires to be contiguous. Lock sync and surface a
  diagnostic instead.
- **Never apply a change group partially.** The cursor advances only
  through the last group fully applied.

When to sync: on startup with an active account, on regained connectivity,
on page visibility after real inactivity, at the end of a review session, on
a settings change, on debounced study activity, when the outbox crosses a
size threshold, and on an explicit `sync.now()`. Not after every grade —
the outbox exists precisely so that batching is possible.

### Status codes

| Status        | What it means                | What the engine does                       |
| ------------- | ---------------------------- | ------------------------------------------ |
| `401`         | Session gone                 | Lock account data, move to signed-out      |
| `402`         | Entitlement lapsed           | Read-only; **keep the outbox**             |
| `409`         | Sequence gap or stale device | Lock sync, surface a diagnostic            |
| `413`         | Batch too large              | Shrink future batches; keep the first row  |
| `429`         | Rate limited                 | Respect `Retry-After`                      |
| `5xx`/timeout | Server or network trouble    | Backoff with jitter; stay writable offline |

Nothing in that table discards an unacknowledged operation. That is the
point of it.

## 4. F.A.Q

**Why only two routes?**
Because one endpoint means one cursor, one sequence space, one outbox, one
backoff, and one place where "did this actually land" is answered. Per-domain
endpoints would each need their own version of all of that, and the moment
two of them disagree about ordering, a note edit and the grade that happened
after it can be applied out of order.

**Why is starting a bootstrap a `GET` when it registers a device?**
Convenience, and it is the one place this contract bends HTTP convention.
Collapsing "start a run" and "fetch a page" into one route removes a whole
call and a whole response shape, and the side effect is idempotent in
practice — a device registration for an already-registered session returns
the existing `deviceId`. Flagging it rather than deciding it silently: if a
proxy or cache in front of this ever treats a `GET` as replayable in a way
that matters, the fix is a `POST /sync/bootstrap` that returns page 0, not a
change to the paging model.

**Why must a client treat `hasMore` as mandatory?**
Because ignoring it is the one bug that silently corrupts an account. A
client that doesn't understand the field, stops after one page, and marks
the cache active has just told the user their account is empty — and every
subsequent sync will faithfully keep it that way. Failing loudly on a
response you can't fully consume is the only safe behavior.

**How is a bootstrap consistent if it spans several requests and the account
can change in between?**
The run is pinned to `snapshotRevision`. Pages only return rows at or below
it. A row that changes mid-run may be missing from its page — and then
arrives, in its newest form, on the first `/sync` after activation, because
that pull starts from exactly `snapshotRevision`. Nothing has to hold a
database transaction open across HTTP requests.

**Why do changes come back as whole rows instead of patches?**
Because a row that changed at revisions 11 and 18 only needs its revision-18
state sent — with patches, both would have to be kept, in order, forever.
Whole rows are why no permanent change-log table is needed on either side:
a pull is "select current rows with `serverRevision` greater than my cursor,"
and a deletion is just a row whose `active` went false.

**Is `POST /sync` paginated?**
Both halves are, differently. The push is bounded by `syncMaxOperations` and
`syncMaxBytes` — send the next contiguous batch, repeat until the outbox is
empty. The pull is bounded by `maxBytes`/`maxChangeGroups` and signalled by
`hasMoreChanges` — repeat with the returned cursor until it's false. Neither
uses page numbers, because neither is a fixed result set being walked; both
are "catch up until caught up."

**What stops a retry from double-counting a practice session or a grade?**
The high-water mark, and the fact that it commits in the same transaction as
the increments it authorized. An operation whose `deviceSequence` is at or
below `acceptedThroughSequence` is skipped before anything is applied, so
resending a batch after a timeout is exactly as safe as sending it once.
This is the property that makes derived summaries possible at all — without
it, "add one to today's count" could not be retried and every device would
have to send absolute snapshots instead.

**Why does the engine send facts through the same route as everything else,
instead of posting raw events somewhere cheap?**
Because the backend derives card state and summaries from those facts, so it
needs them inside the sync transaction. Archival happens on the server's own
side afterward, behind a transactional outbox it drains at its own pace. The
practical consequence for a client: its obligation ends at the sync
acknowledgement. An archive backlog is an operator's problem, not a status
the browser has to model, display, and retry.

**Why send `catalogSha256` and not just `catalogVersion`?**
Because a version string is a claim and a hash is a check. If two builds
ever disagree about what `kanji-review-v1` contains, the version alone will
happily let them sync review cards keyed to different catalogs. The hash
turns that into a refusal at the door.

**Why is there a `warnings` array instead of failing the operation?**
Because all three warning cases describe an operation that was _accepted_
and produced a correct result that just isn't the one the device expected.
Rejecting them would create a sequence gap over something that isn't an
error. A warning tells the user's device to reconcile its optimistic guess;
it doesn't ask it to retry anything.

**What isn't in this document?**
Authentication (PIN request, verify, logout, session) and anything about
cold-archive retrieval. Both are real routes; neither is part of the sync
loop, and mixing them in here would blur the one thing this contract is:
how local state and server state converge.
