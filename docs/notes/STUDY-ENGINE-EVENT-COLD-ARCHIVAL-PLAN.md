# Study Engine: Event Cold Archival Proposed Plan

Proposed extension to
[`STUDY-ENGINE-PLAN-V2.md`](./STUDY-ENGINE-PLAN-V2.md) for when Postgres cannot
hold an unbounded `review_events` history.

Related context:
[`STUDY-ENGINE-STORAGE-AND-ACCESS-DISCUSSION.md`](./STUDY-ENGINE-STORAGE-AND-ACCESS-DISCUSSION.md).

This is **not** part of the current V2 decisions unless adopted. V2 today keeps
all immutable review events in the backend relational database.

## Problem

Immutable review events are the scheduling source of truth. Under V2 they live
in Postgres (`review_events`) forever so the backend can:

- Replay a card after a late offline review
- Rebuild projections after settings / FSRS version changes
- Audit and recover from corruption

Compacting `account_changes` does **not** reduce `review_events` growth. At
enough accounts and years of reviews, hot SQL storage for the full event log
may become too expensive.

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
Hot (Postgres)                         Cold (object storage)
----------------                       ----------------------
recent review_events                   older review_events chunks
card projections                       immutable, reloadable
daily summaries
domain rows (pile, notes, ...)
account_changes window
archive index metadata
```

Normal request path uses hot data only. Rebuild path may fetch cold chunks for
affected cards, concatenate with the hot tail, and replay with the shared
deterministic FSRS core.

## Retention policy

### Hot retention window

Keep events in Postgres for a configurable hot window.

**Recommended starting point:** 90 days.

**Hard floor:** must be greater than or equal to the offline access window
(currently 14 days). Archiving inside the offline window would make ordinary
late sync depend on cold fetches.

Rationale for 90 days:

- Comfortably above the 14-day offline grant
- Absorbs clock skew / delayed sync edge cases without cold I/O
- Still bounds SQL growth per account

### Soft archival (recommended default)

1. Select events older than the hot window whose order key is strictly before
   the affected card’s current projection frontier.
2. Write them into immutable cold chunks.
3. Record archive index rows in Postgres.
4. Delete (or mark archived and later purge) those event rows from
   `review_events`.
5. Keep projections and daily summaries untouched.

Events remain authoritative because they are still reloadable.

### Hard deletion (optional later policy)

A second TTL may eventually delete cold objects too. That is a separate product
decision:

- After hard deletion, ancient late histories cannot be perfectly replayed
- Projections become the practical source of truth past that point
- Do **not** enable hard deletion in the first archival rollout

## What stays hot forever

These remain in Postgres regardless of archival:

| Data                             | Why                               |
| -------------------------------- | --------------------------------- |
| `review_card_projections`        | Live scheduling state for clients |
| `review_daily_summaries`         | Dashboard without full event scan |
| Pile, bookmarks, notes, settings | Current domain state              |
| Hot `review_events` tail         | Late offline sync + cheap replay  |
| `review_event_archives` index    | Locate cold chunks                |
| Bounded `account_changes`        | Ordered sync delivery             |
| `processed_operations`           | Idempotent sync                   |

## Cold object layout

Prefer card-scoped chunks so a single-card rebuild does not download an
account-wide dump.

```text
events/{account_id}/{kanji}/{card_type}/{chunk_id}.jsonl.gz
```

Fallback time-partitioned layout if card-scoped packing is too chatty:

```text
events/{account_id}/{yyyy}/{mm}/part-{nnnn}.jsonl.gz
```

Chunk rules:

- Append-only and immutable after upload
- One content type: JSON Lines (or equivalent) of canonical review event rows
- Gzip or similar compression
- Include enough fields to replay without joining deleted hot rows
- Content hash recorded in the archive index for integrity checks

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

## Postgres archive index

New logical table:

```text
review_event_archives
  account_id
  archive_id
  kanji                  -- nullable if account-wide chunk
  card_type              -- nullable if account-wide chunk
  from_order_key
  to_order_key
  object_uri
  content_sha256
  event_count
  byte_size
  archived_at
  status                 -- writing | ready | failed | deleting
PRIMARY KEY (account_id, archive_id)
INDEX (account_id, kanji, card_type, to_order_key)
INDEX (account_id, archived_at)
```

Archiver invariants:

- Never delete hot events until the corresponding archive row is `ready` and
  the object exists with the expected checksum
- Never archive an event still required by the live projection frontier unless
  a rebuild path can load it from cold storage first
- Archive jobs are idempotent: retries must not create conflicting ready
  objects for the same event set

## Runtime paths

### Normal sync / rating accept

Unchanged from V2 hot path:

1. Verify session + premium entitlement
2. Accept events into hot `review_events`
3. Replay affected cards from hot history needed for that card
   (projection + hot events; cold fetch not required if hot window holds)
4. Update projections and daily summaries
5. Append `account_changes`

If a late event arrives whose predecessors were archived, the backend loads the
needed cold chunks for that card, replays full history, writes the new
projection, and leaves cold objects in place.

Because the product rejects reviews outside the offline access window, cold
fetches during ordinary sync should be rare when hot retention is ≥ 14 days and
preferably 90 days.

### Projection rebuild (settings / FSRS version change)

Account-wide rebuild job:

1. For each active card, determine required event span
2. Fetch cold chunks listed by `review_event_archives`
3. Read remaining hot events
4. Merge/sort by V2 event order
5. Replay with the shared deterministic FSRS core
6. Publish a new projection generation atomically

Rebuild latency and cost become the main tradeoff of archival.

### Bootstrap / new device

Unchanged:

- Return projections, summaries, and current domain rows
- Do not stream cold event history to clients
- Client continues with cursor pulls after `snapshotCursor`

### Disaster recovery

- Corrupted local client DB: bootstrap as today
- Corrupted hot projection: rebuild from cold + hot events
- Missing cold object: alert; do not delete remaining hot/archive metadata
  until repaired

## Archiver job

Background job per account or account shard:

1. Compute archive cutoff = now − hot retention window
2. Find archivable events older than cutoff and before each card’s projection
   frontier
3. Pack into chunks under a size/count budget (e.g. N events or M MB)
4. Upload object with checksum
5. Insert/update archive index as `ready`
6. Delete archived rows from `review_events` in the same transactional boundary
   that the database supports for that step (if object store is external, use
   a two-phase ready/purge pattern so a crash never loses the only copy)
7. Emit metrics: events archived, bytes uploaded, hot table size, purge lag

Suggested safety pattern:

```text
writing -> upload object -> ready -> purge hot rows
```

Failed uploads stay `failed` and are retried. Never purge on `writing` or
`failed`.

## Interaction with existing V2 mechanisms

| Mechanism                    | Interaction                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| 14-day offline access grant  | Hot retention must be ≥ 14 days; user messaging stays tied to the grant, not archival |
| `account_changes` compaction | Independent; still compact delivery log after bootstrap frontier                      |
| Bootstrap snapshots          | Remain the device checkpoint; archival is server-only                                 |
| Deterministic FSRS core      | Same replay rules; input may come from cold + hot concatenation                       |
| Premium entitlement          | Unchanged; archival is storage policy, not access control                             |
| Stress test (2.19M events)   | Re-run with archival enabled: measure hot size, cold fetch rebuild time               |

## Product / UX implications

- No change for users who sync inside the offline window
- No need for a “weekly checkpoint deletion” warning
- Keep existing guidance: come online within the offline access window so
  offline access and sync stay valid
- Optional ops alert if an account’s rebuild requires unusually large cold
  fetches

## Rollout plan

1. **Measure first** — run the V2 review-history stress test and estimate
   per-account / fleet Postgres growth without archival.
2. **Add archive index + object storage writer** behind a feature flag; do not
   purge yet.
3. **Dual-write validation** — archive candidates to cold storage and verify
   checksum + replay parity against hot rows before purge.
4. **Enable purge** for accounts above a hot-size threshold.
5. **Keep hard cold TTL off** until an explicit product decision.

## Open decisions

- Exact hot retention length (30 vs 90 days; recommend 90 to start)
- Card-scoped vs time-partitioned chunk layout as the default
- Maximum chunk size / event count
- Whether any admin/export API needs direct cold event access
- Whether hard cold deletion is ever acceptable, and after how long
- Storage vendor and retention/compliance requirements for cold objects

## Adoption criteria

Adopt this plan into V2 only when:

- Measured or projected `review_events` SQL cost exceeds acceptable budget, and
- Soft archival replay tests show projection parity with full-hot replay, and
- Rebuild latency budgets for settings changes remain acceptable with cold
  fetches

Until then, V2’s “retain all review events in Postgres” remains the simpler
default.
