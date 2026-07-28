# Activity public API

Internal engine/backend mechanics are not here — only what is exposed,
and why each piece exists.

## 1. The public `ActivityApi`

```ts
// ---- Basic building blocks ----

type UnixMs = number;
type LocalDate = string; // YYYY-MM-DD, e.g. "2026-07-28"
type IanaTimeZone = string; // e.g. "Asia/Manila"

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

type Result<T> = { ok: true; value: T } | { ok: false; error: ActivityError };

type ActivityError =
  | { code: "storage_quota" }
  | { code: "read_only" } // account entitlement has lapsed
  // The host should rarely see this in practice — it means a round somehow
  // finished with an impossible shape, e.g. attemptedCount below correctCount.
  | { code: "validation_failed" };

// ---- Recording a completed practice round ----

// One variant per practice mode. Adding a new mode (speaking, shadowing)
// adds a new variant in a coordinated engine release — see FAQ.
type PracticeActivityEventInput =
  | {
      type: "speed_katakana_session_completed";
      challengeId: string;
      accuracyPercent: number;
      charactersPerMinute: number;
      startedAt: UnixMs;
      endedAt: UnixMs;
      timeZone: IanaTimeZone;
    }
  | {
      type: "reading_practice_round_completed";
      correctCount: number;
      attemptedCount: number;
      startedAt: UnixMs;
      endedAt: UnixMs;
      timeZone: IanaTimeZone;
    }
  | {
      type: "writing_practice_round_completed";
      correctCount: number;
      attemptedCount: number;
      startedAt: UnixMs;
      endedAt: UnixMs;
      timeZone: IanaTimeZone;
    };

interface ActivityWrite {
  // Rarely needed directly — exists so this exact completion can be told
  // apart from any other, e.g. if it's ever retried, synced twice, or
  // looked up in a bug report.
  readonly eventId: string;
}

// ---- Reading activity back ----

interface DailySummaryRange {
  from: LocalDate; // inclusive
  to: LocalDate; // inclusive
}

// One row per local day that had any activity. See FAQ for how to treat a
// day with no row.
interface DailySummary {
  readonly localDate: LocalDate;

  readonly speedKatakanaSessions: number;
  readonly readingPracticeRounds: number;
  readonly writingPracticeRounds: number;

  // FSRS review activity lands in the same row as practice activity. See FAQ.
  readonly readingCardsReviewed: number;
  readonly writingCardsReviewed: number;
  readonly ratingAgain: number;
  readonly ratingHard: number;
  readonly ratingGood: number;
  readonly ratingEasy: number;
}

interface AllTimeSummary extends Omit<DailySummary, "localDate"> {
  readonly cakeDay: LocalDate | null; // null only for an account with no activity yet
  readonly daysActive: number; // count of distinct local days with any activity
}

interface ChallengeSummaryQuery {
  activityType: "speed_katakana"; // only one activity type has challenges today
  challengeIds?: readonly string[]; // omit for every challenge
}

interface ChallengeScore {
  readonly value: number; // accuracyPercent or charactersPerMinute, depending on which "best" this is
  readonly achievedAt: UnixMs;
  readonly eventId: string; // breaks a tie when two attempts land on the exact same value
}

interface ChallengeSummary {
  readonly challengeId: string;
  readonly attemptCount: number;

  readonly latestAt: UnixMs;
  readonly latestAccuracyPercent: number;
  readonly latestCharactersPerMinute: number;

  readonly bestAccuracy: ChallengeScore;
  readonly bestCharactersPerMinute: ChallengeScore;
  // Undefined until an attempt has cleared 70% accuracy — a raw speed
  // record set by mashing through wrong answers shouldn't count as a
  // "fast and accurate" best. See FAQ.
  readonly bestCharactersPerMinuteAbove70Accuracy?: ChallengeScore;
}

// ---- The API itself ----

interface ActivityApi {
  // Fire-and-forget from the host's point of view: never blocks the end
  // screen, and if the engine is unavailable or read-only, just skip it.
  record(input: PracticeActivityEventInput): Promise<Result<ActivityWrite>>;

  // Powers a calendar-style heatmap. Ranged rather than "everything," since
  // rows accumulate for the life of the account. See FAQ.
  watchDaily(input: DailySummaryRange): QueryStore<readonly DailySummary[]>;

  // Cheap totals and cake day, without pulling the full daily history. See FAQ.
  watchAllTime(): QueryStore<AllTimeSummary>;

  watchChallenges(
    input: ChallengeSummaryQuery
  ): QueryStore<readonly ChallengeSummary[]>;
}
```

## 2. F.A.Q

**What counts as "practice activity," and how is it different from a
review?**
A practice round — Speed Katakana, a reading round, a writing round — is an
ungraded exercise: no card, no due date, no rating history, none of the FSRS
machinery `ReviewsApi` carries. A review grade is a different kind of fact
entirely, and lives on `ReviewsApi`
([review-public-api.md](./review-public-api.md)). The two do share one
thing: both eventually land in the same `DailySummary` row — see the next
question.

**Why is FSRS review activity mixed into the same `DailySummary` row as
practice activity, instead of two separate rows or two separate calls?**
So a calendar view of "what did I do today" is one query instead of two. A
host building the heatmap doesn't need to know or care that a "review" and a
"practice round" are different kinds of fact internally — it just wants a
day's totals in one place.

**Why does `record()` return so little, and what does "fire-and-forget"
mean here?**
The host already knows what happened — it just ran the round and is showing
its own end screen from its own local result. `record()` isn't asked for
permission or for data back; it's a durable receipt. The write commits
locally right away (that's where `eventId` comes from) and syncs in the
background. If the engine happens to be unavailable or the account is
read-only, the call is simply skipped — nothing about the end screen the
host already built needs to change because of that.

**Why doesn't `record()`'s input include when the event happened
(`occurredAt`) or what local calendar day it falls on (`localDate`)?**
Both were cut, and `localDate` is the more important of the two to get
right. It's tempting to compute it as
`new Date(occurredAt).toISOString().slice(0, 10)` — which is wrong, because
that slices in UTC, not the person's local day. Someone practicing at 7 AM
in a UTC+8 time zone would have that session silently filed under the
previous day, and it stays wrong forever, since daily rows accumulate for
the life of the account and are never rebuilt from scratch. The fix is to
not ask the host to compute it at all: the engine derives `localDate` from
`endedAt` and the `timeZone` the host already supplies, once, correctly, in
one place. `occurredAt` is cut for a related reason — the engine already
stamps a call-time instant the same way it stamps `eventId` and account and
device identity, so a host-supplied "when did this happen" would just
duplicate a value the engine can already see for itself.

**If the engine stamps its own timestamp, why does the host still have to
pass `startedAt`, `endedAt`, and `timeZone`?**
Because those are things only the host actually knows. A practice round runs
entirely inside host UI and host game logic — the engine has no visibility
into when a round began or ended, so `startedAt`/`endedAt` have to come from
there. `timeZone` is the same kind of fact: which local day and which time
zone a device was in at the moment of practice isn't something the engine
can reconstruct after the fact.

**Why isn't there a `schemaVersion` field on the input, the way the raw
event has one internally?**
Because the host doesn't choose it — the engine build does. If a practice
event's shape ever needs to change incompatibly, that shows up as a new
`type` variant (the same way a future speaking/shadowing mode would arrive
as a new variant), not as the host manually incrementing a version number it
has no way to reason about.

**What happens when a new practice mode (like speaking or shadowing) is
added?**
It arrives as a new variant in `PracticeActivityEventInput`, shipped
together with the backend logic that knows how to fold it into a daily
summary — never as a free-form event the backend has to guess how to count.
An unrecognized `type` fails validation rather than silently going
uncounted.

**Why doesn't a practice round record which kanji were involved?**
A reading or writing round exercises many kanji at once and reports one
pair of numbers — `correctCount` / `attemptedCount` — not a per-kanji
result. That's a real limit, not an oversight: per-kanji accuracy from
ungraded practice isn't tracked anywhere in this design. If that's ever
wanted, it's a new fact shape, not something already hiding in this one.

**Does a day with no activity get a `DailySummary` row full of zeros, or no
row at all?**
No row. Rows exist only for days something was actually recorded — an
account's history isn't pre-filled with hundreds of empty rows a year.
Build a calendar grid by treating any `localDate` missing from the result
as all-zero, not by expecting one row per day in the range.

**Why is `watchDaily` ranged instead of returning full history the way
`bookmarks.watchAll()` does?**
Bookmarks and notes are small, roughly bounded by the kanji catalog. Daily
activity isn't — one row accumulates per active day for as long as the
account exists, which for a multi-year user is a lot of rows to hand back
by default. A host asks for the window it's actually going to render (a
year for a calendar view, a month for a smaller widget) instead of paying
for history nobody's looking at.

**If `watchDaily` is ranged, how does a host show all-time totals and cake
day without fetching the entire history?**
That's what `watchAllTime()` is for — one row, maintained by the engine the
same way a daily row is, instead of asking every host to sum however many
years of daily rows exist just to show a handful of totals.

**Why doesn't `AllTimeSummary` break `daysActive` down by activity kind
(e.g. "days you did Speed Katakana")?**
It doesn't today — `daysActive` counts any day with any activity, full
stop. A host that wants a per-kind version has to derive it by walking
`watchDaily` results itself, which is fine for a bounded range but
expensive for "all time." Flagging this rather than deciding it silently:
if a per-kind all-time breakdown turns out to matter, it belongs on
`AllTimeSummary` directly, not reconstructed by every host that needs it.

**Why does `ChallengeSummaryQuery` require `activityType`, but
`ChallengeSummary` rows don't repeat it back?**
On the way in, it's meaningful — it says which kind of challenge the host
is asking about, and a future second challenge type would make it
load-bearing. On the way out, every row already came from a query scoped to
one `activityType`, so the value would be identical on every single row:
information the caller already gave, echoed back at no benefit. Kept where
it says something; dropped where it doesn't.

**Why do `bestAccuracy`/`bestCharactersPerMinute` carry an `eventId`, but
the "latest" fields don't?**
Bests need a tiebreaker — two attempts can land on the exact same accuracy
or speed, and something has to decide which one "wins" so every device
converges on the same answer. `eventId` is that tiebreaker, and since it's
already there, it doubles as a handle if a host ever wants to point at
"which attempt set this record." "Latest" has nothing to tie-break — by
definition there's exactly one most-recent attempt — so there's no matching
reason to carry its `eventId` along.

**What is `bestCharactersPerMinuteAbove70Accuracy` for, and why can it be
missing?**
Speed Katakana rewards typing fast, but raw speed alone can be gamed by
mashing through wrong answers — this is the "fast and actually correct"
record instead. It's `undefined` until some attempt has actually cleared
70% accuracy; there's nothing to report before that.

**Why is there no `watchChallenge(challengeId)`, just `watchChallenges`
with an optional filter?**
A challenge summary has no "not present" state worth a `null` the way a
single bookmark or note does — a challenge either has an attempt history (a
row) or doesn't (no row, filtered out). `watchChallenges({ challengeIds:
[id] })` already covers "just this one" without doubling the method surface
for a distinction that doesn't exist here the way it does for bookmarks or
notes.

**Why doesn't `DailySummary` or `ChallengeSummary` carry a
`serverRevision`, the way a note or bookmark does?**
Both are entirely engine/backend-derived — nothing a host writes ever
competes to overwrite one, the way an edit could race a note. A revision
check exists to catch a stale write; there's no write here to be stale.
