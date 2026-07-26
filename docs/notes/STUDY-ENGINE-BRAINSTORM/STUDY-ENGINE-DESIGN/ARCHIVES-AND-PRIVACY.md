# Archives and Privacy

This document owns raw-event durability, operational and research archive
separation, displaced note text, retention, opt-out behavior, export and
deletion boundaries, and privacy limitations.

It is an engineering specification, not legal advice. Launch policy requires
market-specific privacy review.

## Two archives with different purposes

The design has two intentionally separate datasets:

1. **Operational archive**
   - Account-associated.
   - Contains accepted raw practice and FSRS review events.
   - May contain note text displaced by a merge that exceeded the merged byte
     limit.
   - Supports support investigation, account export, audit, future operational
     recovery features, and per-user FSRS weight fitting if that deferred
     feature is ever built.
   - Raw review events are retained for the account lifetime. Other classes
     have a backend-published retention period.
   - Is deleted with the account, subject to documented backup/deletion
     processing.

2. **Research dataset**
   - Receives transformed practice/review records only.
   - Exists for population analytics and possible future model fitting.
   - Never supports account restore or individual history display.
   - Excludes note/bookmark content and direct identity.
   - Is governed by the research participation setting and a separate
     de-identification review.

Do not reuse an operational object as “anonymous research data” by merely
dropping one column.

```mermaid
flowchart LR
    Engine[StudyEngineOutbox] --> Sync[SyncTransaction]
    Sync --> Delivery[TransactionalDeliveryOutbox]
    Delivery --> Ingest[RetryingArchiveWorker]
    Ingest --> Operational[AccountOperationalArchive]
    Operational --> Retention[OperationalRetention]
    Operational --> Eligibility[ResearchParticipationCheck]
    Eligibility --> Transform[DeidentifyAndMinimize]
    Transform --> Research[SeparateResearchDataset]
    Operational --> Export[SupportManagedExport]
    Operational --> Delete[AccountDeletionWorkflow]
```

## Event delivery contract

Archival is a **backend** responsibility. The browser has no archive pipeline,
no archive sequence space, and no archive acknowledgement to wait for.

```mermaid
flowchart TD
    UserAction[AcceptedStudyAction] --> LocalTx[IndexedDBTransaction]
    LocalTx --> Projection[OptimisticLocalProjection]
    LocalTx --> Operation[OneOutboxOperation]
    Operation --> Sync[UnifiedSync]
    Sync --> Ingest[BackendIngestTransaction]
    Ingest --> Canonical[CanonicalStateAndDerivedSummaries]
    Ingest --> Delivery[TransactionalDeliveryOutboxRow]
    Delivery --> Worker[RetryingWorker]
    Worker --> R2[OperationalArchive]
```

The contract:

- Every fact has a stable globally unique `eventId`.
- The browser retains the operation until the sync acknowledgement.
- The backend appends the raw event to a transactional delivery outbox inside
  the same transaction that accepts the fact, so an acknowledged fact can never
  be lost before reaching the archive.
- A retrying worker drains that table into R2 and deletes delivered rows.
- The sink deduplicates by `eventId`.
- Redis may accelerate or batch this work but can never be the only copy.

Exactly-once network delivery is neither required nor realistic. Exactly-once
materialization is achieved by idempotent event IDs.

### What the single pipeline changed

Previously the browser kept a second outbox and uploaded raw events to a
separate endpoint with its own sequence space and high-water mark. An R2
outage then surfaced in the browser as a degraded archive status with a growing
local backlog, which the engine had to model, expose, warn about, and retry
independently of hot sync.

With one pipeline, the client's obligation ends at the sync acknowledgement and
an R2 outage is a server-side backlog the operator can see and alert on. That
is a better place for it. Removed: `archiveSequence`,
`acceptedThroughArchiveSequence`, `POST /api/events/batch`, `ArchiveSnapshot`,
`archiveBacklogWarningBytes`, and the state in which hot data had converged
while its raw events were still queued locally.

The tradeoff accepted in exchange: raw events now travel on the transactional
sync path and count against published sync count and byte limits. For the
version-one event types this is negligible. A future fat event type would
deserve a fresh assessment rather than an automatic second pipeline.

Local storage pressure is now one condition rather than two. If quota prevents
committing the mutation, it returns `storage_quota` and nothing is reported as
saved.

## Operational event envelope

All operational objects use a versioned envelope:

```ts
interface OperationalEventEnvelopeV1<TType extends string, TPayload> {
  archiveSchemaVersion: 1;
  eventId: string;
  eventType: TType;

  accountArchiveKey: string;
  deviceArchiveKey: string;
  deviceSequence: number;

  occurredAt: UnixMs;
  receivedAt: UnixMs;
  localDate: LocalDate;
  timeZone?: IanaTimeZone;

  engineVersion: string;
  applicationId: string;
  catalogVersion: string;
  schedulerVersion?: string;

  payload: TPayload;
}
```

`accountArchiveKey` and `deviceArchiveKey` are backend-generated opaque keys,
not email addresses or public account/device IDs. Postgres retains the mapping
needed for export/deletion. Removing direct IDs does not make the operational
record anonymous; it remains intentionally account-associated.

The backend overrides account/device keys from authenticated context. It never
trusts client-supplied archive ownership.

## Operational event types

### Practice

Version-one raw practice events mirror the validated contract union:

```text
speed_katakana_session_completed
reading_practice_round_completed
writing_practice_round_completed
```

They may include:

- start/end/occurrence instants;
- local date/time zone;
- typed challenge/session settings;
- score inputs such as accuracy and CPM;
- counts needed to explain the hot summary;
- event schema and app version.

Do not include rendered screen content, arbitrary host state, IP address in the
payload, browser fingerprint, or unrelated settings.

Future speaking/shadowing variants require a new typed schema and privacy
review before collection.

### FSRS review

A raw review event may include:

- card/pile generation archive keys;
- kanji and reading/writing type;
- rating;
- adjusted and reported review instants;
- prior and provisional card state;
- settings/scheduler versions;
- elapsed/scheduled days;
- stability/difficulty;
- event predecessor and base revision;
- backend merge outcome such as replay, direct apply, LWW winner, or ignored
  deleted generation.

This “fat” event supports explanation and future model analysis without
querying the current card row. It does not make the archive authoritative for
hot sync.

### Displaced note text

Notes are not research events and are never sent to research transformation.

Concurrent divergent note edits merge into the canonical note, so in the normal
case nothing is displaced and nothing reaches the archive. The previous design
required a durable R2 write **inside the sync transaction** before a conflict
copy could be replaced, which put an external service dependency on the
transactional hot path for an event occurring a few times per user per year.
That requirement is gone.

One residual case remains. If two divergent edits are together larger than
`noteMergedMaxUtf8Bytes`, the backend keeps the deterministic winner alone and
writes the displaced text to the operational archive for support recovery. That
write goes through the ordinary delivery outbox and does not block the sync
transaction.

The object includes kanji, displaced Markdown content, the canonical revision
at displacement, writer metadata, and timestamps. It is exportable and is
deleted with the account.

## R2 object layout

One possible logical layout:

```text
operational/v1/accounts/<accountArchiveKey>/events/<yyyy>/<mm>/<batchId>.jsonl.zst
operational/v1/accounts/<accountArchiveKey>/displaced-notes/<yyyy>/<objectId>.json.zst
operational/v1/accounts/<accountArchiveKey>/exports/<exportId>.zip

research/v1/reviews/<yyyy>/<mm>/<partitionId>.parquet
research/v1/practice/<eventType>/<yyyy>/<mm>/<partitionId>.parquet
```

The operational prefix is partitioned **by account first**, and must stay that
way. Reading one user's full review history is then a prefix list plus a few
object reads, which is what per-user FSRS weight fitting would require. A
global time-partitioned layout would be more convenient for population
analytics and would turn per-user training into a full-corpus scan. Population
analytics is what the research dataset is for; it should not dictate the
operational layout.

File formats are replaceable implementation details, but objects must have:

- schema version;
- record count;
- uncompressed byte count;
- content checksum;
- creation time;
- retention class;
- encryption metadata;
- no secrets in object names.

Batch small events to avoid per-event object cost. Batch boundaries do not
affect event identity or deduplication.

Operational and research data should use separate buckets or strict prefixes
with separate IAM policies, lifecycle rules, and audit logs. A research worker
should not need permission to read displaced note text.

## Durable acceptance

The sync transaction is the point of durability. Because the raw event is
appended to a transactional Postgres delivery outbox in the same transaction
that accepts the fact, acknowledging the sync request already guarantees the
event will reach the archive.

The delivery outbox is short-lived infrastructure, not a permanent user event
table. Monitor its oldest undelivered row and delete rows after verified R2
persistence.

Redis may cache or coalesce work but cannot be the only accepted copy.

## Deduplication

Deduplication is now a property of sync rather than a second protocol.

- An operation at or below the device's `accepted_sequence` is skipped before
  it can produce a delivery outbox row, so a client retry cannot enqueue the
  same event twice.
- Reusing a sequence with a different `eventId` is a protocol integrity error.
- Reusing an `eventId` with different content is an integrity or security
  error.
- The R2 sink still keeps an event-ID dedupe index or a deterministic object
  key, because the worker itself retries and may write the same batch twice.
- Content hashes guard inconsistent duplicates.

## Operational retention

Retention is backend-published policy, not hardcoded in the shared contract.

The policy response should state:

```ts
interface OperationalRetentionPolicy {
  policyVersion: string;
  rawPracticeEventDays: number;
  rawReviewEventDays: number | null; // null means account lifetime
  displacedNoteDays: number;
  exportBundleDays: number;
  deletionSlaDays: number;
}
```

`rawReviewEventDays` is `null`. Review events are retained for the account
lifetime because they are the only corpus from which a user's own FSRS weights
could later be fitted, and because the anonymized research dataset cannot serve
that purpose by construction.

The cost is small enough that it is not the deciding factor. A heavy user
generating on the order of 25,000 reviews a year produces roughly 15 MB of raw
JSON, which compresses to about 1 MB a year. The deciding factors are the
disclosure this requires and the fact that account deletion becomes the only
path by which review history leaves the system, which makes the deletion
workflow's R2 prefix sweep load-bearing rather than merely tidy.

The UI may display this policy, but StudyEngine does not provide legal copy.

Lifecycle rules:

- Set R2 object lifecycle metadata at write time.
- Do not extend retention silently when rewriting/compacting an object.
- A compaction manifest preserves the earliest source expiry.
- Delete expired Postgres archive mappings.
- Export generation does not reset source retention.
- Operational retention expiration may make old displaced note text or raw
  practice events unavailable. Raw review events do not expire. Current hot
  projections remain unaffected.

## Research participation

Selected product policy:

- Research participation is enabled by default with opt-out.
- Changing the setting is a premium mutation in the first release.
- After entitlement loss, the user must contact support to opt out, export, or
  delete.

This policy has a known risk: support-only withdrawal is more difficult than
default enrollment and may fail privacy/consent requirements in some markets.
It must pass explicit legal and product review before launch. The architecture
should keep the backend endpoint capable of a future entitlement-independent
opt-out even if the first UI does not expose it.

Research state is backend-authoritative:

```ts
interface ResearchParticipation {
  state: "enabled" | "disabled";
  policyVersion: string;
  updatedAt: UnixMs;
  effectiveAfterEventId?: string;
}
```

Do not rely only on a cached client setting. The research transformer checks
current backend state immediately before transfer.

## Opt-out behavior

On opt-out:

1. Stop transferring future operational records to research.
2. Cancel queued, not-yet-transformed research work for the account.
3. Delete traceable staged or pseudonymous research records that still have a
   reversible account mapping.
4. Keep operational records under operational retention unless account
   deletion is also requested.
5. Disclose that prior records that were already irreversibly anonymized cannot
   be selected for individual deletion.

```mermaid
stateDiagram-v2
    [*] --> OperationalOnly
    OperationalOnly --> ResearchQueued: Participation enabled
    ResearchQueued --> OperationalOnly: Opt out before transform
    ResearchQueued --> TraceableResearch: Pseudonymous staging
    TraceableResearch --> DeletedTraceable: Opt out
    TraceableResearch --> AnonymousResearch: Irreversible transform
    AnonymousResearch --> [*]
    DeletedTraceable --> [*]
```

The system must not promise deletion of irreversibly anonymous records while
also retaining a hidden join key that makes that deletion possible. If a join
key exists, the data is still traceable and belongs in the traceable category.

## Research transformation

Research output must exclude:

- email, account ID, account archive key;
- device ID, device archive key, IP address;
- session cookie or entitlement data;
- note Markdown and note metadata;
- bookmarked word and bookmark metadata;
- exact object path from operational storage;
- request/diagnostic IDs that can join to server logs.

Possible retained review features, subject to review:

- card type;
- rating;
- scheduler/settings schema version;
- bucketed elapsed/scheduled days;
- bounded stability/difficulty values;
- learning state;
- coarse date bucket or no calendar date;
- relative event order within a short anonymous sample.

Possible retained practice features:

- practice type and schema version;
- challenge category that is not user-generated;
- bucketed accuracy/speed/duration;
- coarse date bucket;
- app/engine version when needed for quality analysis.

Data minimization should prefer derived/bucketed features over copying the
entire fat operational payload.

## “Anonymous” is a conclusion, not a field operation

Removing account ID and changing an exact timestamp to a date does not by
itself prove anonymity. Re-identification may use:

- upload timing and server access logs;
- rare event sequences;
- unique device or version combinations;
- object paths and batch IDs;
- retained operational-to-research mappings;
- small cohorts;
- detailed FSRS trajectories.

Required pre-release work:

- Document the research purpose and minimum fields.
- Perform a re-identification/threat assessment.
- Define minimum cohort/partition sizes.
- Review logs, backups, staging, and data warehouse copies.
- Verify access controls and deletion of temporary mappings.
- Define retention and downstream use.
- Publish accurate user disclosure.

Do not write “sidesteps GDPR erasure by construction” in production
documentation without qualified legal and technical assessment.

## Account export

The first release may fulfill exports through support, but the backend should
have a reproducible export job.

An export can contain:

- current notes;
- bookmarks;
- FSRS settings and current cards;
- device-owned daily/challenge summaries;
- retained operational raw events;
- retained displaced note text;
- policy/version metadata.

It must not contain:

- another account's data;
- server secrets or internal fraud signals;
- anonymous research rows that can no longer be linked;
- raw cookies/PIN records.

Export bundles use short retention and authenticated/support-controlled
delivery. Creating an export must not prolong source-object retention.

## Account deletion

Confirmed backend deletion is authoritative:

```mermaid
flowchart TD
    DeleteRequest[ConfirmedAccountDeletion] --> Revoke[RevokeSessionsAndLeases]
    Revoke --> Block[BlockNewSyncAndArchiveIngest]
    Block --> HotDelete[DeletePostgresHotData]
    Block --> OperationalDelete[DeleteOperationalPrefixesAndMappings]
    Block --> TraceableDelete[DeleteTraceableResearchStaging]
    HotDelete --> Tombstone[RecordMinimalDeletionTombstone]
    OperationalDelete --> Tombstone
    TraceableDelete --> Tombstone
    Tombstone --> LocalSignal[ReturnDeletedAccountStateOnContact]
    LocalSignal --> LocalPurge[PurgeMatchingIndexedDBCachesAndOutboxes]
```

The minimal deletion tombstone must contain only what is required to prevent
accidental recreation/replay and must itself have a retention policy.

If an old offline device returns:

- reject its session/device and pending operations;
- report the account-deleted state;
- purge its matching local cache;
- never replay its outbox into a new account.

Prior irreversibly anonymous research rows are not linkable for account
deletion by definition.

## Lapsed entitlement

Under the selected first-release access policy:

- Cached hot data is readable.
- New study mutations and sync are blocked.
- The pending outbox remains local and intact.
- Renewal resumes it.
- Support handles opt-out, export, and deletion.

Because no new study events can be created in read-only mode, the pending
outbox cannot grow after entitlement loss. Existing operational events may
remain eligible for research transformation until support records opt-out.
This behavior must be disclosed and reviewed.

## Data security

Operational safeguards:

- TLS in transit.
- Provider/server-side encryption at rest.
- Separate IAM for operational, research, export, and deletion workers.
- No public buckets.
- Short-lived service credentials and audited access.
- Content checksums and immutable event IDs.
- Content-size controls for displaced note payloads.
- Redaction of note content and event payloads from application logs.
- Backup policies aligned with deletion/retention disclosures.

Client safeguards:

- Do not place account IDs or content in console logs.
- Do not cache authenticated API responses in the service worker.
- Keep the outbox in the isolated account database.
- Purge it on confirmed local removal or remote deletion.
- Expose storage pressure rather than silently dropping events.

Application-level IndexedDB locking is not encryption. A person with access to
the browser profile or same-origin code may inspect retained data.

## Failure and recovery

### Durable sink unavailable

R2 being unavailable is now invisible to clients. The fact was already accepted
and its delivery outbox row is durable.

- Leave the delivery outbox row undelivered.
- Do not fail or delay sync.
- Back the worker off with jitter.
- Alert on oldest undelivered delivery-outbox age.

### Partial object write or checksum mismatch

- Do not acknowledge.
- Delete/quarantine the bad object.
- Retry with the same event IDs.

### Duplicate event

- Verify matching content hash.
- Return acknowledgement without writing a second logical record.

### Research transform failure

- Keep operational source unchanged.
- Retry from a durable work record.
- Re-check participation at retry time.
- Never fall back to copying the raw operational object unchanged.

### Retention worker failure

- Alert on overdue objects.
- Do not silently alter published retention metadata.
- Run idempotent deletion repair.

## Monitoring

Track without content:

- client pending outbox count/bytes/oldest age;
- ingest batch count/bytes/latency;
- duplicate and content-mismatch rates;
- durable queue/outbox oldest age;
- R2 write/checksum failures;
- operational object count/bytes by retention class;
- research eligible/transformed/skipped/opted-out counts;
- traceable staging age;
- account deletion completion and SLA breaches;
- export generation duration/failure;
- note merge count and merge-truncation displacement count.

Access to operational/research monitoring must not provide a side channel for
reading user content.

## Privacy launch gates

Before collecting production research data:

1. Finalize package/service privacy roles and lawful basis.
2. Review default-with-opt-out behavior.
3. Review support-only withdrawal after entitlement loss.
4. Validate the de-identification transform and cohort thresholds.
5. Publish operational/research retention.
6. Exercise export, opt-out, and deletion end to end.
7. Verify logs/backups/staging obey the same boundaries.
8. Confirm terms accurately distinguish operational history from research use.

If these gates are incomplete, operational archival may launch without
research transformation. Research is optional to core sync correctness.
