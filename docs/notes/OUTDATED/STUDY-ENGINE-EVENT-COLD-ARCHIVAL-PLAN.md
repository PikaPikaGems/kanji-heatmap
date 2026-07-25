# Study Engine: Event Cold Archival Plan

Adopted extension to
[`STUDY-ENGINE-PLAN-V2.md`](./STUDY-ENGINE-PLAN-V2.md) for bounding Postgres
`review_events` storage without deleting scheduling history.

Related context:
[`STUDY-ENGINE-STORAGE-AND-ACCESS-DISCUSSION.md`](./STUDY-ENGINE-STORAGE-AND-ACCESS-DISCUSSION.md).

Resolved policy:

- Keep a rolling 90-day event tail in Postgres.
- Archive older events to private Cloudflare R2 Standard account-month chunks.
- Keep verified cold events indefinitely.
- Begin SQL purge only after readback, checksum, and replay-parity validation.

## Problem

Immutable review events are the scheduling source of truth. Hot and cold events
together allow the backend to:

- Replay a card after a late offline review
- Rebuild projections after settings / FSRS version changes
- Audit and recover from corruption

Compacting `account_changes` does **not** reduce `review_events` growth.
Without archival, enough accounts and years of reviews make hot SQL storage
for the full event log unnecessarily expensive.

Weekly or biweekly **deletion** of events in favor of a snapshot alone is the
wrong fix: it breaks late offline replay and destroys rebuildability.

## Goal

Bound Postgres event storage while preserving rebuildability.

- Keep a hot event tail in SQL for normal sync and cheap single-card replay
- Move older events to cheaper cold object storage
- Reload cold segments only on rare rebuild / recovery paths
- Leave the client/bootstrap path unchanged: devices still receive projections
  and compact summaries, not the full event log

## Non-goals

- Deleting review history on a weekly/biweekly checkpoint cadence
- Shipping full historical events to browsers
- Replacing card projections as the normal read path
- Making cold storage authoritative for live sync responses
- Solving `account_changes` growth (that remains a separate compaction path)

## Design summary

```text
Hot (Postgres)                              Cold (private R2 Standard)
----------------                            --------------------------
90-day review_events tail                   older account-month chunks
card projections                            immutable jsonl.gz
archive-boundary checkpoints                retained indefinitely
daily summaries
domain rows (pile, notes, ...)
bounded account_changes
archive manifests
```

Normal request paths use current projections, archive-boundary checkpoints,
and hot data only. Full settings/FSRS-version rebuilds and disaster recovery
fetch cold chunks, concatenate them with the hot tail, and replay through the
canonical Python FSRS adapter.

## Retention policy

### Hot retention window

Keep events in Postgres for a rolling **90-day** hot window.

**Hard floor:** must be greater than or equal to the offline access window
(currently 14 days). Archiving inside the offline window would make ordinary
late sync depend on cold fetches.

The archiver runs daily or weekly. Ninety days is an age cutoff, not a cadence
for one large quarterly migration.

Rationale:

- Comfortably above the 14-day offline grant
- Absorbs clock skew / delayed sync edge cases without cold I/O
- Still bounds SQL growth per account

### Soft archival

1. Select events older than the hot window whose order key is strictly before
   the affected card’s current projection frontier.
2. Write them into immutable account-month cold chunks.
3. Read the object back and verify its checksum.
4. Replay the candidate archive set and verify projection parity.
5. Record a ready archive manifest and advance affected per-card boundary
   checkpoints.
6. Only then purge those event rows from `review_events`.
7. Keep current projections and daily summaries untouched.

Events remain authoritative because they are still reloadable.

### Cold retention

Verified R2 events are retained indefinitely. There is no hard cold-object TTL
in V2. The incremental storage cost is much smaller than the correctness and
operational cost of making projections authoritative past an arbitrary date.
Account deletion remains an explicit exception and removes that account's
objects, manifests, checkpoints, and hot rows.

## What stays hot forever

These remain in Postgres regardless of archival:

| Data                              | Why                                    |
| --------------------------------- | -------------------------------------- |
| `review_card_projections`         | Live scheduling state for clients      |
| `review_card_archive_checkpoints` | Base state before each card's hot tail |
| `review_daily_summaries`          | Dashboard without full event scan      |
| Pile, bookmarks, notes, settings  | Current domain state                   |
| Hot `review_events` tail          | Late offline sync + cheap replay       |
| `review_event_archives` manifests | Locate and verify cold chunks          |
| Bounded `account_changes`         | Ordered sync delivery                  |
| Non-review `processed_operations` | Idempotency for typed upserts          |

## Cold object layout

Use one or more account-month chunks:

```text
events/{account_id}/{yyyy}/{mm}/part-{nnnn}.jsonl.gz
```

At the generous workload of 200 reviews per account per day, one account-month
contains about 6,000 events. This is large enough to compress well and small
enough for rare rebuild reads. With 2,000 accounts, the layout creates about
24,000 objects per year before any unusually large month is split into parts.
It avoids the tiny-object and manifest complexity of card-scoped storage while
preserving straightforward account export and deletion.

Chunk rules:

- Append-only and immutable after upload
- One content type: JSON Lines (or equivalent) of canonical review event rows
- Gzip or similar compression
- Include enough fields to replay without joining deleted hot rows
- Content hash recorded in the archive index for integrity checks
- Private bucket; no direct browser URLs or credentials
- Schema version recorded in metadata

Each serialized event must include at least:

```text
event_id
device_id
device_sequence
kanji
card_type
rating
reviewed_at
local_date
utc_offset_minutes
```

Ordering keys used for replay remain the V2 order:

1. `reviewedAt`
2. `deviceId`
3. `deviceSequence`
4. event ID

## Postgres archive metadata

Archive manifest:

```text
review_event_archives
  account_id
  archive_id
  year_month
  part_number
  from_order_key
  to_order_key
  object_uri
  content_sha256
  event_count
  byte_size
  schema_version
  archived_at
  status                 -- writing | validating | ready | failed | purged
PRIMARY KEY (account_id, archive_id)
UNIQUE (account_id, year_month, part_number)
INDEX (account_id, year_month, status)
```

`purged` means the covering SQL rows were deleted; the R2 object remains
immutable, authoritative, and discoverable. Rebuilds read both `ready` and
`purged` manifests.

Per-card archive-boundary checkpoint:

```text
review_card_archive_checkpoints
  account_id
  kanji
  card_type
  through_order_key
  card_state
  settings_version
  fsrs_version
  source_archive_generation
  updated_at
PRIMARY KEY (account_id, kanji, card_type)
```

The checkpoint is a rebuildable optimization, not a replacement source of
truth. It stores the canonical card state immediately before the remaining hot
tail. A late event accepted inside the 14-day offline window can therefore
replay checkpoint + ordered hot events without reading R2. Settings or
FSRS-version changes invalidate old checkpoints and regenerate them while
replaying cold + hot events.

Archiver invariants:

- Never delete hot events until the corresponding archive row is `ready` and
  object readback matches the expected checksum.
- Never advance a checkpoint until replay parity against the current canonical
  projection succeeds.
- Never archive an event at or after the affected card's live projection
  frontier.
- Archive jobs are idempotent: retries must not create conflicting ready
  objects for the same event set.
- A failed object, checksum, replay, or metadata transaction leaves the SQL
  events untouched.

## Runtime paths

### Normal sync / rating acceptance

1. Verify session + premium entitlement
2. Accept events into hot `review_events`
3. For a newest in-order event, advance the current canonical projection
4. For a late event, load the card's archive-boundary checkpoint and ordered
   hot tail, insert the event, and replay that tail
5. Update projections and daily summaries
6. Append `account_changes`

Because the backend rejects reviews outside the 14-day offline access window
and the hot tail is 90 days, an accepted late review is always after the
archive boundary. Ordinary sync therefore does not fetch R2. If checkpoint
metadata is missing or invalid, the safe fallback is cold + hot replay; it is
never acceptable to guess a projection.

### Projection rebuild (settings / FSRS version change)

Account-wide rebuild job:

1. For each active card, determine required event span
2. Fetch the account-month chunks listed by `review_event_archives`
3. Read remaining hot events
4. Merge/sort by V2 event order
5. Replay with the canonical Python FSRS adapter
6. Regenerate archive-boundary checkpoints for the new settings/FSRS version
7. Publish a new projection generation atomically

Rebuild latency and cost become the main tradeoff of archival.

### Bootstrap / new device

Unchanged:

- Return projections, summaries, and current domain rows
- Do not stream cold event history to clients
- Client continues with cursor pulls after `snapshotCursor`

### Disaster recovery

- Corrupted local client DB: bootstrap as today
- Corrupted hot projection: rebuild from cold + hot events
- Corrupted checkpoint: regenerate it from cold events without trusting it
- Missing cold object: alert; do not delete remaining hot/archive metadata
  until repaired

## Archiver job

Run a bounded background job daily or weekly:

1. Compute archive cutoff = now − hot retention window
2. Select a closed account-month event range older than cutoff and before every
   affected card's projection frontier
3. Pack one or more size-bounded `jsonl.gz` parts
4. Insert or resume a deterministic `writing` manifest
5. Upload each object and read it back
6. Verify checksum, schema, event count, event boundaries, and ordering
7. Replay the candidate archived facts plus remaining hot events and compare
   with current canonical projections
8. In one Postgres transaction, mark manifests `ready` and advance affected
   per-card archive-boundary checkpoints
9. In a later idempotent purge transaction, delete only rows covered by ready
   manifests and checkpoints
10. Let autovacuum make deleted pages reusable
11. Emit metrics: events/bytes archived, compression ratio, hot table and index
    size, oldest hot event, validation failures, purge lag, and rebuild time

Suggested safety pattern:

```text
writing -> upload -> validating -> ready -> checkpoint -> purge SQL rows
```

Failed upload or validation stays `failed` and is retried. Never purge on
`writing`, `validating`, or `failed`. R2 and Postgres cannot share one
transaction, so the ready/checkpoint/purge sequence intentionally tolerates
duplicate data but never a period with no authoritative copy.

Deleting rows does not reduce already provisioned Render disk. It prevents
future growth and lets PostgreSQL reuse pages. The job must begin before
storage autoscaling raises the permanent allocation; routine `VACUUM FULL` is
not part of normal archival.

## Interaction with existing V2 mechanisms

| Mechanism                    | Interaction                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------- |
| 14-day offline access grant  | Hot retention is 90 days; user messaging stays tied to the grant, not archival    |
| `account_changes` compaction | Independent; still compact delivery log after bootstrap frontier                  |
| Review-event idempotency     | `operationId = event.id`; no second permanent processed row per review            |
| Bootstrap snapshots          | Remain the device checkpoint; archival is server-only                             |
| Python FSRS adapter          | Canonical replay consumes ordered cold + hot facts                                |
| Premium entitlement          | Unchanged; archival is storage policy, not access control                         |
| Stress test (2.19M events)   | Re-run with archival enabled: measure hot size, validation, and cold rebuild time |

## Product / UX implications

- No change for users who sync inside the offline window
- No need for a “weekly checkpoint deletion” warning
- Keep existing guidance: come online within the offline access window so
  offline access and sync stay valid
- Optional ops alert if an account’s rebuild requires unusually large cold
  fetches

## Rollout plan

No event is eligible before day 91:

1. **Measure immediately** — generate representative rows and record
   `pg_total_relation_size`, index size, bloat, and replay performance.
2. **Provision private R2 Standard** — use least-privilege backend credentials;
   clients never receive object access.
3. **Ship manifests, checkpoints, and writer behind flags** — initially create
   candidate objects without deleting SQL.
4. **Validate** — read objects back and compare checksums, counts, order
   boundaries, and canonical replay results against still-hot rows.
5. **Enable checkpoint publication** — only for validated ranges.
6. **Enable purge** — on or after day 91, only for ranges whose manifests and
   checkpoints are ready.
7. **Fail safe** — if code or validation is late, let Postgres grow temporarily
   instead of weakening a purge invariant.

There is no hard R2 TTL rollout. Account deletion is implemented and tested
separately from retention.

## Remaining implementation choices

The product decisions are resolved. Implementation benchmarks still choose:

- Maximum compressed part size and event count
- Archiver concurrency and per-run account budget
- R2 retry and alert thresholds
- Rebuild latency and memory budgets
- Whether an admin/export API needs direct cold-event access
