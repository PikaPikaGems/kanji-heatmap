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

// One variant per practice mode. Adding a new mode adds a new variant in a
// coordinated engine release — see FAQ.
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
  // No accuracy/speed fields — attemptCount is derived by counting these
  // facts, the same way speed_katakana's attemptCount is. See FAQ.
  | {
      type: "speaking_practice_session_completed";
      challengeId: string;
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
  from: LocalDate; // inclusive, the oldest date in the window
  totalDays: number; // window extends forward from `from`; see FAQ
}

// One card type's review activity for a day (or all-time, via
// AllTimeSummary). Shared between reading and writing so both are counted
// the same way instead of two near-identical shapes. See FAQ.
interface ReviewSummary {
  readonly totalReviewCount: number;
  readonly again: number;
  readonly hard: number;
  readonly good: number;
  readonly easy: number;
}

// The counts shared by one local day (`watchDailySummaries`) and the
// account's all-time totals (`AllTimeSummary`, via
// Omit<ActivitiesSummary, "localDate">) — see FAQ for why one shape covers
// both instead of two near-identical ones.
interface ActivitiesSummary {
  readonly localDate: LocalDate;

  readonly practiceEventsCount: {
    readonly speedKatakana: number; // sessions
    readonly speaking: number; // sessions
    readonly reading: number; // rounds
    readonly writing: number; // rounds
  };

  // FSRS review activity lands in the same row as practice activity. See FAQ.
  readonly reviews: {
    // A pile item counts on the day pile.add() actually creates or
    // reactivates it — not on a redundant add of something already active.
    // Not split by card type: a pile item always creates one reading card
    // and one writing card together, so the two counts would always be
    // identical. See FAQ.
    readonly totalReviewItemsAdded: number;
    readonly reading: ReviewSummary;
    readonly writing: ReviewSummary;
  };
}

interface AllTimeSummary extends Omit<ActivitiesSummary, "localDate"> {
  readonly cakeDay: LocalDate | null; // null only for an account with no activity yet
  readonly daysActive: {
    readonly total: number; // distinct local days with any activity at all
    readonly practiceEventsCount: {
      readonly speedKatakana: number;
      readonly speaking: number;
      readonly reading: number;
      readonly writing: number;
    };
    readonly reviews: {
      readonly reading: number;
      readonly writing: number;
    };
  };
}

type ChallengeActivityType = "speed_katakana" | "speaking_practice";

interface ChallengeScore {
  readonly value: number; // accuracyPercent or charactersPerMinute, depending on which "best" this is
  readonly achievedAt: UnixMs;
  readonly eventId: string; // breaks a tie when two attempts land on the exact same value
}

// One shape per activityType, not one row with fields that only sometimes
// apply. See FAQ for why speaking practice's shape is this thin.
type ChallengeSummary =
  | SpeedKatakanaChallengeSummary
  | SpeakingPracticeChallengeSummary;

interface SpeedKatakanaChallengeSummary {
  readonly activityType: "speed_katakana";
  readonly challengeId: string;
  readonly attemptCount: number;

  readonly latest: {
    readonly timestamp: UnixMs;
    readonly accuracyVal: number;
    readonly cpmVal: number;
  };

  readonly best: {
    readonly accuracy: ChallengeScore;
    readonly cpm: ChallengeScore;
    // Undefined until an attempt has cleared 70% accuracy — a raw speed
    // record set by mashing through wrong answers shouldn't count as a
    // "fast and accurate" best. See FAQ.
    readonly cpmOver70?: ChallengeScore;
  };
}

interface SpeakingPracticeChallengeSummary {
  readonly activityType: "speaking_practice";
  readonly challengeId: string;
  readonly attemptCount: number;
}

// ---- The API itself ----

interface ActivityApi {
  // Fire-and-forget from the host's point of view: never blocks the end
  // screen, and if the engine is unavailable or read-only, just skip it.
  record(input: PracticeActivityEventInput): Promise<Result<ActivityWrite>>;

  // Powers a calendar-style heatmap. Windowed rather than "everything,"
  // since rows accumulate for the life of the account. One row per local
  // day that had any activity — a day with nothing recorded has no row.
  // See FAQ.
  watchDailySummaries(
    input: DailySummaryRange
  ): QueryStore<readonly ActivitiesSummary[]>;

  // Cheap totals and cake day, without pulling the full daily history. See FAQ.
  watchAllTime(): QueryStore<AllTimeSummary>;

  // null means this challenge has never been attempted. Powers a
  // per-challenge view (e.g. stats shown before starting that challenge
  // again). See FAQ.
  watchChallenge(input: {
    activityType: "speed_katakana";
    challengeId: string;
  }): QueryStore<SpeedKatakanaChallengeSummary | null>;
  watchChallenge(input: {
    activityType: "speaking_practice";
    challengeId: string;
  }): QueryStore<SpeakingPracticeChallengeSummary | null>;

  // Powers a full-collection view (e.g. a grid of every challenge at once).
  watchAllChallenges(
    activityType: "speed_katakana"
  ): QueryStore<readonly SpeedKatakanaChallengeSummary[]>;
  watchAllChallenges(
    activityType: "speaking_practice"
  ): QueryStore<readonly SpeakingPracticeChallengeSummary[]>;
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
thing: both eventually land in the same `ActivitiesSummary` row — see the
next question.

**Why is FSRS review activity mixed into the same `ActivitiesSummary` row as
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

**What happens when a new practice mode is added?**
It arrives as a new variant in `PracticeActivityEventInput`, shipped
together with the backend logic that knows how to fold it into a daily
summary — never as a free-form event the backend has to guess how to count.
An unrecognized `type` fails validation rather than silently going
uncounted. Speaking practice, added after this document's first draft, is
the concrete example: one new write variant, one new `ActivitiesSummary`
count, and — because it's challenge-based like Speed Katakana rather than
round-based like reading/writing practice — one new branch of
`ChallengeSummary`. See the next few questions.

**Why is speaking practice's event named
`speaking_practice_session_completed` rather than
`..._round_completed`, the way reading/writing practice are?**
The suffix says which bucket a practice type falls into. A "session" belongs
to one `challengeId` and shows up in `watchChallenge`/`watchAllChallenges`
(Speed Katakana, speaking practice); a "round" has no challenge identity and
only ever contributes a count to `ActivitiesSummary` (reading, writing
practice). The name is a small signal for which part of this API a given
practice type actually touches.

**Why did `ChallengeSummary` become a union with an `activityType`
discriminant, when a single flat shape would be simpler?**
Because it's no longer true that every challenge looks like Speed Katakana.
Speaking practice is challenge-based too, but doesn't have a speed, an
accuracy, or a "best" of anything — see the next question. Forcing both
into one shape would mean either lying with fields that don't apply
(`best.accuracy` on something with no such concept) or making half the
fields optional and leaving the host to guess which ones are real for a
given row. A union says outright which fields exist for which
`activityType`.

**Why does `SpeakingPracticeChallengeSummary` only expose `attemptCount`,
when the practice-event input still carries `startedAt`/`endedAt` like
everything else?**
Those are two different questions — what gets recorded, and what gets
surfaced — and they don't have to move together. `startedAt`/`endedAt` are
recorded on every practice event regardless of type, because the backend
needs them (local-day derivation, the archive, `ActivitiesSummary`'s
counts). None of that requires exposing anything more than a count back to
the host today. If a "last practiced" timestamp or a duration stat turns
out to matter for speaking practice later, that's an additive field on
`SpeakingPracticeChallengeSummary`, not a breaking change — exactly the
reasoning notes and bookmarks use elsewhere in this API for leaving a field
out until something actually reads it.

**Why doesn't the speaking-practice input carry its own `attemptCount`?**
Same reason Speed Katakana's input doesn't: it isn't the host's number to
report. `attemptCount` is the backend counting how many
`speaking_practice_session_completed` facts it has seen for a given
`challengeId` — one increment per completed session, derived the same way
Speed Katakana's `attemptCount` already is.

**Why doesn't a practice round record which kanji were involved?**
A reading or writing round exercises many kanji at once and reports one
pair of numbers — `correctCount` / `attemptedCount` — not a per-kanji
result. That's a real limit, not an oversight: per-kanji accuracy from
ungraded practice isn't tracked anywhere in this design. If that's ever
wanted, it's a new fact shape, not something already hiding in this one.

**Why is the type called `ActivitiesSummary` rather than `DailySummary`?**
Because it isn't only a daily row — `AllTimeSummary` reuses the exact same
counts (via `Omit<ActivitiesSummary, "localDate">`) for the account's
lifetime totals, which are not daily anything. Calling the shared shape
`DailySummary` was accurate for the one place it's used with `localDate`
attached and misleading everywhere else it's reused. `ActivitiesSummary` is
just "these counts of activity" — daily when `watchDailySummaries` attaches
a date to it, all-time when `AllTimeSummary` doesn't.

**Does a day with no activity get an `ActivitiesSummary` row full of
zeros, or no row at all?**
No row. Rows exist only for days something was actually recorded — an
account's history isn't pre-filled with hundreds of empty rows a year.
Build a calendar grid by treating any `localDate` missing from the result
as all-zero, not by expecting one row per day in the range.

**Why is `watchDailySummaries` windowed instead of returning full history
the way `bookmarks.watchAll()` does?**
Bookmarks and notes are small, roughly bounded by the kanji catalog. Daily
activity isn't — one row accumulates per active day for as long as the
account exists, which for a multi-year user is a lot of rows to hand back
by default. A host asks for the window it's actually going to render (a
year for a calendar view, a month for a smaller widget) instead of paying
for history nobody's looking at.

**If `watchDailySummaries` is windowed, how does a host show all-time
totals and cake day without fetching the entire history?**
That's what `watchAllTime()` is for. Nothing extra is stored for it — the
engine works it out from the daily rows it already has (earliest date is the
cake day, `daysActive.total` is the row count, `daysActive`'s per-kind
fields count rows where that kind happened at all, everything else is a
sum) and keeps the answer in memory, redoing it when a daily row changes.
Even a decade of
practice every single day is well under four thousand small rows, so this is
cheap; the point of the method is that the host doesn't have to pull that
history down and add it up itself.

**Why is the window expressed as `from` + `totalDays` instead of `from` +
`to`?**
The common case — a rolling window like "the last 365 days" — only needs one
date computed (`from`), not two. The one case this makes slightly more
awkward is browsing a specific past calendar year, where `totalDays` has to
be 365 or 366 depending on the year; getting that wrong just renders one day
short in a leap year, not a data problem — nothing gets written or
miscounted the way the `localDate` UTC-slice bug would. If exact
calendar-year browsing turns out to be common enough to deserve its own
shape, that's a second, additive query shape later, not a reason to
complicate the common case now.

**Why does `AllTimeSummary.daysActive` break down by activity kind, instead
of staying the single number it started as?**
An earlier draft left it as one count and flagged the per-kind version
rather than building it speculatively: "if it turns out to matter, it
belongs on `AllTimeSummary` directly, not reconstructed by every host that
needs it." It now matters — a profile stat like "you've added a review item
on 120 days" needs the per-kind total as a cheap all-time number, the same
way plain `daysActive` already is one. This is separate from a day-by-day
heatmap itself, which reads each day's own count straight off
`watchDailySummaries` and never touches `AllTimeSummary` at all;
`daysActive`'s breakdown only exists for a total worth showing without
walking the whole window to add it up. Structured the same way as
`ActivitiesSummary` (`practiceEventsCount`/`reviews`) so the two stay easy
to read side by side — see the next few questions.

**Why did `ActivitiesSummary` change from one flat list of counts to
`practiceEventsCount`/`reviews` sub-objects?**
The flat list grew two things that don't actually belong to the same bucket
— game/practice counts and FSRS review counts — into one wall of
same-looking numbers. Nesting groups them the way this API already talks
about them elsewhere (see "What counts as 'practice activity'" above),
without losing the "one row, one query" property that question was about:
it's still one `ActivitiesSummary` per day, just organized instead of flat.

**Why does `reviews.totalReviewItemsAdded` count once, not split into
`reading`/`writing` the way ratings are?**
Because a pile item always creates one reading card and one writing card
together — adding a kanji to the pile has no reading-only or writing-only
form, so a split would just be the same number twice. It sits next to
`reading`/`writing` rather than inside `ReviewSummary` for that reason: it's
a fact about the pile item, not about either card type.

**Why isn't adding a pile item a `PracticeActivityEventInput` variant, the
way a practice round is?**
That union exists for facts the engine has no way to see on its own — a
round that ran entirely in host UI. Adding a pile item is the opposite: the
engine executes `pile.add()` itself (review-public-api.md), so it already
knows an add happened the instant it happens, the same way it already knows
about a grade without a host reporting it separately. It updates the day's
`totalReviewItemsAdded` as part of that call, not through a second, separate
report — see that document's FAQ for how it credits the correct local day
without needing a `timeZone` from the host.

**Why is `watchChallenge` a separate method from `watchAllChallenges`,
instead of one method with an optional filter?**
An earlier draft of this document argued the opposite — one method, an
optional list of IDs, no single-item method at all — on the reasoning that a
challenge summary has no meaningful "not present" state worth a dedicated
`null`-returning call. That reasoning didn't hold up: a screen that shows
one challenge's history before the player starts it again is a real,
single-item, live view, and `null` for "never attempted this one" is exactly
as meaningful there as `null` is for an unbookmarked kanji. Once that
pattern exists, an all-in-one method with an optional filter is worse than
the split: the filtered case — a specific handful of IDs, neither one nor
all — never had an actual reader, so it's dropped rather than kept "just in
case." The names also now match the `watch()`/`watchAll()` pattern
bookmarks and reviews already use, rather than inventing a new one just for
challenges.

**Why do `watchChallenge`/`watchAllChallenges` take `activityType` as a
literal per overload instead of one signature typed to the general union?**
So the return type is already narrowed at the call site — asking for
`"speaking_practice"` gets back `SpeakingPracticeChallengeSummary` directly,
not the wider `ChallengeSummary` union the host would otherwise have to
narrow itself with an `if (row.activityType === ...)` check before reading
anything past `attemptCount`. `activityType` still lives on every row
regardless — a value that gets passed around at runtime should say what it
is on its own, not rely on whoever's holding it remembering which call
produced it.

**Why do `best.accuracy`/`best.cpm` carry an `eventId`, but
`latest` doesn't?**
Bests need a tiebreaker — two attempts can land on the exact same accuracy
or speed, and something has to decide which one "wins" so every device
converges on the same answer. `eventId` is that tiebreaker, and since it's
already there, it doubles as a handle if a host ever wants to point at
"which attempt set this record." `latest` has nothing to tie-break — by
definition there's exactly one most-recent attempt — so there's no matching
reason to carry its `eventId` along.

**What is `best.cpmOver70` for, and why can it be missing?**
Speed Katakana rewards typing fast, but raw speed alone can be gamed by
mashing through wrong answers — this is the "fast and actually correct"
record instead. It's `undefined` until some attempt has actually cleared
70% accuracy; there's nothing to report before that.

**Why do `latest`/`best` nest instead of staying flat
(`latestAccuracyPercent`, `bestCharactersPerMinute`, ...)?**
The flat names existed to carry "which of these is this" in the name itself
since there was nothing else to group them by. Nesting says the same thing
structurally — `best.accuracy` instead of `bestAccuracy` — and reads better
once there's more than one or two fields per group.

**Why doesn't `ActivitiesSummary` or `ChallengeSummary` carry a
`serverRevision`, the way a note does?**
Because both are entirely engine/backend-derived — there's no local host
write that could ever be ahead of or behind the server's copy, the way a
note edit could be before it's synced. `KanjiNoteView` keeps `serverRevision`
for that reason. Bookmarks don't carry one at all (bookmark-public-api.md):
once a bookmark is genuinely just boolean membership with no payload,
there's nothing left for a revision to describe.
