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
  cleanup lever and remains independent of event archival.
- V2 keeps 90 days of `review_events` in Postgres and retains older events in
  private R2 Standard account-month chunks.
- Weekly/biweekly **deletion** of review events is risky because late offline
  reviews require ordered replay. The adopted design instead uses verified cold
  facts plus a per-card archive-boundary checkpoint and hot tail.
- The existing **14-day offline access window** is already the user-facing
  “come online periodically” rule. Framing it as “open the app online at least
  every couple of weeks” matches the plan; weekly is stricter than necessary
  unless the grant window is shortened.
- Cold archival is part of V2: events leave SQL only after object readback,
  checksum verification, and replay parity, and remain reloadable indefinitely.

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

V2 keeps a rolling 90-day event tail in Postgres and archives older immutable
events to a private Cloudflare R2 Standard bucket. R2 events are retained
indefinitely so they remain available for projection rebuild, audit, and
disaster recovery.

The hot `review_events` table and each serialized cold event contain:

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

Hot and cold events together remain the scheduling source of truth for:

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

### Review-volume-safe sync infrastructure

Archiving `review_events` would not bound SQL growth if each review also left
another permanent row in `processed_operations` or `account_changes`.

V2 therefore uses three separate rules:

- Review-event `operationId` equals `event.id`. The backend deduplicates review
  pushes with the `review_events` primary key and unique device sequence; it
  does not create a second permanent `processed_operations` row per review.
- Non-review typed upserts continue to use `processed_operations`.
- `account_changes` is compacted after supported clients can bootstrap beyond
  its compaction frontier.

The non-review receipt table is low-volume rather than strictly bounded. Its
retention can be revisited from measured usage; it is not multiplied by the
146-million-review planning bound. These cleanup paths are independent of cold
archival.

---

## Back-of-the-envelope capacity and cost

Estimate dated **July 21, 2026**. It is a planning bound, not a vendor quote.
All figures are in USD.

### Workload assumption

- 2,000 daily active users
- 200 review ratings per user per day
- 400,000 review events per day
- 146,000,000 review events per year
- 4.63 ratings per second on average

Two hundred ratings means 20 ten-item rounds. That is plausible for a heavy
learner. Assuming every one of 2,000 registered users does this every day is
deliberately generous. For comparison, 25% daily activity at 100 ratings per
active user produces 18.25 million events per year, one eighth of the planning
bound.

### SQL storage assumption

Budget **1 to 1.5 KB of attributable hot SQL storage per accepted rating**.
This is intentionally conservative and includes the event heap row, primary
key and replay indexes, page overhead/bloat allowance, and bounded sync
infrastructure attributable to reviews. It assumes review pushes do not create
a second permanent idempotency row.

Without archival:

- End-of-year event-attributable SQL: **146 to 219 GB**
- Average first-year stored amount while growing linearly: **73 to 109.5 GB**

With a rolling 90-day hot tail:

- Steady hot event footprint: **36 to 54 GB**
- Average first-year hot amount during the initial ramp and steady tail:
  approximately **31.6 to 47.3 GB**

Actual size must be measured from representative data before selecting the
production plan:

```sql
SELECT count(*) FROM review_events;
SELECT pg_total_relation_size('review_events');
SELECT pg_indexes_size('review_events');
```

The benchmark should also measure bounded `account_changes`, non-review
`processed_operations`, autovacuum behavior, write-ahead log volume, backups,
and projection-rebuild compute.

### Render estimate

Current references:

- [Render pricing](https://render.com/pricing)
- [Render Postgres flexible plans](https://render.com/docs/postgresql-refresh)

Render bills Postgres storage at **$0.30 per GB-month** independently of
compute.

- No archival, Basic-1GB compute at $19/month: approximately **$491 to
  $622/year**. This is a price floor, not a recommendation; 1 GB RAM is risky
  for this row count and rebuild workload.
- No archival, Pro-4GB compute at $55/month: approximately **$923 to
  $1,054/year**.
- Ninety-day hot retention, Pro-4GB compute: approximately **$774 to
  $830/year**, plus negligible R2 cost.

These figures exclude the FastAPI web service/worker, observability, taxes,
unusual bandwidth, and backup charges not included by the selected plan.
Render storage cannot be reduced after provisioning, so archival must start
before autoscaling permanently raises allocated capacity. Deleted pages should
be reused through normal autovacuum; routine `VACUUM FULL` is not part of the
plan.

### Heroku estimate

Current references:

- [Heroku pricing](https://www.heroku.com/pricing/)
- [Heroku Postgres plans](https://elements.heroku.com/addons/heroku-postgresql)

Heroku plans have fixed storage tiers:

- Essential-2 provides 32 GB at $20/month and does not fit the generous
  90-day estimate.
- Standard-0 provides 64 GB at $50/month, or **$600/year**. A 36 to 54 GB hot
  tail can fit, but the upper bound leaves little room for projections,
  sync tables, bloat, and operational headroom.
- Without archival, the first-year 146 to 219 GB endpoint requires at least
  Standard-2 with 256 GB at $200/month, or **$2,400/year**. The upper estimate
  is still close enough to the tier limit to require measurement.

Heroku's tier jump makes archival financially more significant than on Render.
Render's independently scalable storage is the safer initial choice while
actual row size and active-user behavior are unknown.

### Cloudflare R2 estimate

Current reference:
[Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/).

R2 Standard includes 10 GB-month of storage, 1 million Class A operations, and
10 million Class B operations per month. Additional storage is $0.015 per
GB-month with no internet-egress charge.

Assume compressed canonical JSON Lines consumes 100 to 300 bytes per event:

- At the end of year one, approximately 110 million events are older than 90
  days: **11 to 33 GB** compressed.
- First-year R2 Standard storage and operation cost should be approximately
  **$0 to $2** after the monthly free tier.
- Each later full year adds roughly **15 to 44 GB**, approximately $0.23 to
  $0.66 per month at current storage rates.

Account-month chunks create about 24,000 objects per year for 2,000 accounts,
far below the monthly Class A free allowance. R2 Infrequent Access has no
Standard free tier and adds retrieval charges, so Standard is simpler and
likely cheaper at this scale.

---

## Adopted cold-archival policy

The detailed design lives in
[`STUDY-ENGINE-EVENT-COLD-ARCHIVAL-PLAN.md`](./STUDY-ENGINE-EVENT-COLD-ARCHIVAL-PLAN.md).

The resolved policy is:

- Keep 90 rolling days of events in Postgres.
- Run the archiver daily or weekly; do not perform one large migration every
  90 days.
- Store one or more immutable `jsonl.gz` chunks per account/month in a private
  R2 Standard bucket.
- Keep verified R2 events indefinitely.
- Maintain a rebuildable per-card archive-boundary checkpoint so a late event
  inside the 14-day offline window replays from checkpoint + hot tail without
  fetching cold history.
- Do not purge SQL until object readback, checksum verification, and replay
  parity all pass.
- If verification fails, retain SQL rows and alert.
- New-device bootstrap remains projections + summaries; it never downloads
  cold events.
- Full settings/FSRS-version rebuilds and disaster recovery read cold + hot
  facts through the canonical Python adapter.
- Account deletion removes the account's hot rows, archive manifests,
  checkpoints, and R2 objects.

No event becomes eligible before day 91. The archive writer and validation path
can therefore ship behind feature flags before the first purge. Correctness
wins over the retention target: if purge readiness is late, Postgres grows
temporarily rather than deleting an unverified source of truth.

The user-facing offline guidance remains tied to the 14-day access grant, not
to archival. Premium entitlement still gates cloud sync; the offline grant
separately gates cached local access.
