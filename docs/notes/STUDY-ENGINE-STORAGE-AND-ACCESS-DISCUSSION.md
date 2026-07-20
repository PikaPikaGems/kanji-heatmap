# Study Engine: Storage, Entitlements, and Offline Access Discussion

Notes from clarifying questions on
[`STUDY-ENGINE-PLAN-V2.md`](./STUDY-ENGINE-PLAN-V2.md). Captures the original
concerns, term explanations, and a cold-archival option for backend review
events.

## Original concerns

### Event log cost and checkpoints

**Worry:** Storing too many event logs in the database may be too costly.

**Idea raised:** Introduce a “checkpoint” (weekly or biweekly) where event
history is deleted and replaced by a snapshot of that point in time.

**Complication raised:** A device that stays offline longer than the
checkpoint window (e.g. more than two weeks) may not have synced yet. If
history was deleted, that offline work could be lost or become unreplayable.

**Product idea raised:** Tell users to come online at least once a week so
their data is not lost.

### What this note concludes on that idea

- The cost concern is real for **backend** storage at scale.
- V2 already has a checkpoint-style path for **devices**: bootstrap from card
  projections and compact daily summaries, not the full event log.
- Compacting `account_changes` (the sync delivery log) is the first safe
  cleanup lever in the written plan.
- Under the current plan, compacting `account_changes` does **not** delete
  `review_events`. Immutable review events remain in Postgres.
- Weekly/biweekly **deletion** of review events is risky because late offline
  reviews need the full event stream for that card to rebuild correctly.
- The existing **14-day offline access window** is already the user-facing
  “come online periodically” rule. Framing it as “open the app online at least
  every couple of weeks” matches the plan; weekly is stricter than necessary
  unless the grant window is shortened.
- If Postgres cannot hold unbounded event history, prefer **cold archival**
  (events leave SQL but remain reloadable) over checkpoint deletion. That
  option is sketched later in this note; it is not spelled out in V2 yet.

---

## Term clarifications

### Premium entitlement checks

**Guess from discussion:** Checking whether the user is allowed to write more
data (e.g. if they paused payment/subscription, they cannot create or mutate
data).

**Verdict:** Mostly correct, with nuance.

Premium entitlement checks are the private backend verifying that the account
currently has premium access (active subscription / paid entitlement) before
accepting premium cloud operations.

From the plan:

- Local FSRS / study logic in public browser code **cannot** be a secure
  paywall.
- Enforceable premium services are authentication, cloud sync, backups, and
  multi-device support.
- Every `POST /api/sync` verifies the HttpOnly session **and** premium
  entitlement.

If payment lapses:

- Cloud push/pull / bootstrap should be refused.
- A device may still have a valid **offline access grant** for up to 14 days,
  so local reads and mutations can continue until that grant expires.
- After the grant expires, the local account database will not open until
  online authentication succeeds — and that online path can refuse access if
  the account is no longer entitled.

So it is not only “can they insert more SQL rows?” It is “are they allowed to
use the premium cloud/sync service right now?” Local offline behavior is
governed separately by the offline access grant.

### Ordered account change delivery

This is the **sync change log**, not the immutable review-event history.

When the backend applies a sync batch (bookmark change, note save, accepted
review, updated card projection, etc.), it appends a row to `account_changes`
with a monotonic `sequence`. Each device stores a cursor (“I have applied
everything through sequence N”) and on sync pulls the next page of changes in
order.

That provides:

- Deterministic catch-up for other devices
- Safe pagination (`hasMore`, `nextCursor`)
- A log that **can** be compacted once all supported clients can bootstrap
  beyond the compaction frontier

“Ordered” means delivered in sequence order so a device does not apply later
state before earlier state, or skip projection updates.

**Important distinction:**

| Store             | Role                                             | Compaction in current plan                 |
| ----------------- | ------------------------------------------------ | ------------------------------------------ |
| `account_changes` | Ordered delivery of account updates to devices   | May be compacted after bootstrap frontier  |
| `review_events`   | Authoritative immutable review facts for rebuild | Kept; independent of change-log compaction |

---

## Offline access grant (plain-language explanation)

After successful online verification, the backend grants a **signed offline
access grant**. The user-facing offline access window expires **14 days from
server time**.

The grant:

- Allows the local account database to open while offline
- Allows offline reads, reviews, notes, bookmarks, and history updates
- Does **not** authorize backend API calls or sync
- Is refreshed after successful online session verification
- Is cleared immediately by explicit logout

After expiration:

- The engine closes the account database and reports logged-out until online
  authentication succeeds
- Pending outbox entries **stay on disk**
- Remote revocation cannot take effect while a device is offline; that is an
  inherent tradeoff of offline access

Product meaning:

- Think of it as a **local hall pass**, not an API password.
- It answers: “How long may this device keep studying offline without
  re-checking the server?”
- It is a **product-policy control for cached local access**, not a secure
  paywall for public browser code.
- Backend sync always requires a current HttpOnly session and entitlement
  check.

If access is revoked on the server (logout elsewhere, cancel premium), a
device that remained offline the whole time will not know until it comes
online again.

---

## Where backend event logs are stored

In V2, backend review history lives in the relational database (Postgres, or
equivalent) as the `review_events` table.

Logical columns:

- `account_id`
- `event_id`
- `device_id`
- `device_sequence`
- `kanji`
- `card_type`
- `rating`
- `reviewed_at`
- `local_date`
- `utc_offset_minutes`

The plan keeps these rows as the scheduling source of truth for:

- Audit
- Projection rebuild
- Disaster recovery
- Late offline sync replay

Clients do **not** normally download the full history. New or repaired devices
bootstrap from:

- Card projections
- Compact review daily summaries
- Other current domain rows

Bootstrap is described in V2 as the V1 checkpoint format for devices. Full-log
replay is a backend recovery/verification tool, not the normal new-device path.

### Compacting `account_changes` vs keeping events

Even after `account_changes` is compacted:

- **Yes, all `review_events` are still kept** under the current written plan.
- Change-log compaction only shrinks the sync delivery queue once clients can
  catch up via bootstrap.
- Event retention is explicitly independent of that cleanup.

Rough capacity intuition (order of magnitude only):

- Each event row is small (hundreds of bytes with indexes).
- The plan’s stress test (about 2.19M events: 2,000/day for three years) is an
  abuse/benchmark bound, not a typical user.
- Postgres is likely fine early; pressure appears at many accounts × long
  unbounded retention.

---

## Cold archival option (if SQL cannot hold unbounded events)

This section entertains the constraint: **we may not have bandwidth/capacity
to keep every review event in Postgres forever.**

Cold archival is a coherent extension of V2. It is **not** yet specified in
the plan document.

### Goal

Bound Postgres event storage while preserving rebuildability, instead of
weekly checkpoint deletion.

### Hot vs cold

**Keep hot in Postgres:**

- Card projections (current scheduling state)
- Review daily summaries (dashboard)
- Pile, notes, bookmarks, settings
- A recent tail of `review_events` for late offline sync and cheap single-card
  replay
- Sync infra (`account_changes` window, `processed_operations`)

**Move cold (object storage such as S3/R2/GCS, or another cheap append-only
store):**

- Older immutable `review_events` past the chosen hot retention window

### Suggested policy

1. **Hot retention window** — e.g. 30–90 days of events in Postgres.
   Must be ≥ the offline access window (14 days is the product floor, not
   necessarily the archive floor).
2. **Archive frontier** — events older than the hot window are written to cold
   storage, then deleted or marked archived in Postgres.
3. Per card, archive only events that are strictly before that card’s current
   projection frontier. Do not drop events still required to explain the live
   projection unless cold metadata can reload them.

### Rebuild behavior after archival

| Operation                             | Behavior                                                 |
| ------------------------------------- | -------------------------------------------------------- |
| Normal sync / new review              | Hot events + current projection only                     |
| Late offline review inside hot window | Replay from hot Postgres events                          |
| Full card rebuild / disaster recovery | Load that card’s cold segment(s) + hot tail, then replay |
| New device bootstrap                  | Still projections + summaries; no full event download    |

Devices stay cheap. Only the backend pays cold-fetch cost, and mainly on rare
rebuild paths.

### Example cold layout

```text
events/{account_id}/{kanji}/{card_type}/{chunk_id}.jsonl.gz
```

or by time:

```text
events/{account_id}/{yyyy}/{mm}/part-000.jsonl.gz
```

Chunks should be append-only and immutable. Postgres can keep a small index,
for example:

```text
review_event_archives
  account_id
  kanji / card_type (or null for account-wide chunks)
  from_order_key
  to_order_key
  object_uri
  event_count
  archived_at
```

### Soft archival vs hard deletion

**A. Soft archival (recommended under the capacity constraint):**

- Events leave Postgres but remain reloadable from cold storage.
- Extremely late rebuilds are slower (cold fetch + replay) but still correct.
- Matches “events remain authoritative.”

**B. Hard deletion after some cold TTL:**

- Eventually drop cold events too.
- Ancient late offline histories can no longer be perfectly replayed.
- Projections become the practical source of truth past that point.
- Real correctness/product tradeoff; not free.

For “SQL is too expensive, but we still care about recoverability,” choose
**A**.

### Interaction with the 14-day offline rule

- Archive only after a window larger than 14 days (e.g. ≥ 30–90 days hot).
- Normal offline users should not hit cold storage on sync.
- Extremely stale devices may need a cold fetch for affected cards, or reviews
  older than the offline window are rejected (V2 already validates timestamps
  against the 14-day window).
- User-facing guidance can remain: be online within the offline access window
  so sync and offline access stay valid. Archival is an ops concern behind
  that.

### Relationship to earlier checkpoint idea

| Approach                            | What happens to events              | Risk                                      |
| ----------------------------------- | ----------------------------------- | ----------------------------------------- |
| Weekly/biweekly checkpoint deletion | Delete history; keep snapshot only  | Breaks late offline replay / rebuild      |
| Compact `account_changes` only      | Events stay in Postgres             | Does not solve unbounded event SQL growth |
| Soft cold archival                  | Events leave SQL, remain reloadable | Extra infra; rare rebuilds slower         |
| Hard delete after cold TTL          | Events eventually gone              | Lose perfect ancient replay               |

Cold archival is the option that addresses SQL capacity without treating the
checkpoint as “delete the source of truth every two weeks.”

### Cost shape under cold archival

- SQL holds a **bounded** event tail per account, not unbounded history.
- Object storage holds the long tail cheaply.
- Rebuild jobs become “fetch cold chunks for N cards” rather than unbounded
  hot-table growth.
- `account_changes` compaction remains independent and should still happen.

---

## Practical stance distilled from the discussion

1. **Devices:** already checkpoint-like via bootstrap projections + summaries.
2. **Sync delivery log:** compact `account_changes` when safe.
3. **Review events (current V2 text):** stay in Postgres `review_events`.
4. **If Postgres cannot afford that:** add soft cold archival (hot tail in SQL,
   long tail in object storage, reload on rebuild).
5. **User messaging:** align with the 14-day offline access window rather than
   inventing a separate weekly deletion policy.
6. **Entitlement:** premium check gates cloud/sync; offline grant separately
   gates cached local access for 14 days.

## Open follow-ups

- Whether to add an explicit “Event cold archival” section to
  `STUDY-ENGINE-PLAN-V2.md`.
- Concrete hot retention length (30 vs 90 days, etc.).
- Whether hard deletion after a cold TTL is ever acceptable for this product.
- Storage/cost budgets from the plan’s review-history stress test once
  measured.
