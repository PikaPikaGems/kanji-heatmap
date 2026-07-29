# Contents

1. Building Blocks and Engine Contract
2. Notes
3. Bookmark
4. Review
5. Activity

- Primitives
- ActivityRecords
- Daily Summaries
- Speed Katakana Challenge Summary
- Exposed Activity API

6. Authentication, Storage, and Sync API
7. Backend Sync Contract
8. IndexDB tables and Schema
9. Open Questions

## Invariants

- Use DexieJS, TS-FSRS, INDEXDB, no other dependencies
- Support offline first, multidevice syncing
- engine design must be framework agnostic
- Backend Canonical Data is Authoritative, Index DB stores, and assumes an optimistic provisional updates which will be overwritten when backend returns canonical data
- you need to login to view your data. You need a "premium entitlement lease" or "premium subscription" in order to add, save, and update new data, without premium, your data will be read-only.

# Building Blocks

```ts
type UnixMs = number;
type Kanji = string;
type LocalDate = string; "MM-DD-YYY" or something

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

type Result<T> = { ok: true; value: T } | { ok: false; error: E };

type ReviewSummary = {
  again?: number
  hard?: number
  good?: number
  easy?: number
}


type EngineAPI {
  bookmarks: BookmarksAPI
  notes: NotesAPI
  reviews: ReviewsAPI
  activity: ActivityAPI

  // TODO: Flesh this out
  auth: {
    // requestPin({ email: string}): PinChallengeId
    // verifyPin({ challengeId: , pin })
    // logout()
  }
  // sync: { now(manualSyncReason?: string): Promise<Result<SyncOutcome>> }
  // storage: { deleteCache(): Promise<Result<void>> } ;
}

interface Engine =
  | { type: 'unavailable '}
  | { type: 'available', engine: EngineAPI }
```

# Notes

```ts
type NoteError =
  | { code: "unsupported_kanji"; kanji: Kanji }
  | { code: "validation_failed"; reason: "length_exceeded" }
  | { code: "storage_quota" }
  | { code: "read_only" }; // account entitlement has lapsed

// One canonical note exists per kanji.
interface KanjiNoteView {
  kanji: Kanji;
  content: string;

  // True when the backend merged a divergent edit from another device into
  // `content`. `content` can be over `maxUtf8Bytes` when this is true
  hasMergedEdit: boolean;
  mergedAt?: UnixMs; // set only alongside hasMergedEdit

  // TODO: Discuss this
  localUpdatedAt: UnixMs;
  lastSync: UnixMs;
  // kanji has a save sitting in the local outbox that the
  // server hasn't acknowledged yet.
  status: "pending-sync" | "synced";
}

type SaveNoteInput = { kanji: Kanji; content: string };

interface NotesApi {
  // The maximum UTF-8 byte size of one saved edit. Fixed for the life of the
  // engine session. Check it live against `content` as the person types —
  // `new TextEncoder().encode(content).length` — not just at save time.
  maxUtf8Bytes: number;

  // null means no note has never been written for this kanji
  watch(kanji: Kanji): QueryStore<KanjiNoteView | null>;

  // intentionally no remove() function, set content="" instead
  save(input: SaveNoteInput): Promise<Result<KanjiNoteView | null>>;
}
```

## FAQ

1. `TODO:` Write down here how are conflicts / simultaneous editing handled? Share specific scenarios

# Bookmark

```ts
type BookmarkError =
  | { code: "unsupported_kanji"; kanji: Kanji }
  | { code: "storage_quota" }
  | { code: "read_only" }; // account entitlement has lapsed

interface BookmarksApi {
  watch(kanji: Kanji): QueryStore<boolean>;

  // The complete set. No paging — this is small, account-scoped data
  watchAll(): QueryStore<readonly Kanji[]>;

  add(kanji: Kanji): Promise<Result<void>>;
  remove(kanji: Kanji): Promise<Result<void>>;
}
```

# Reviews

```ts

type CardType = "reading" | "writing";
type FsrsRating = "again" | "hard" | "good" | "easy";
type FsrsLearningState = "new" | "learning" | "review" | "relearning";


// TODO: Discuss this if we really need the below
// Opaque. Internally it identifies a kanji + card type + "which attempt at
// this kanji" (in case it was removed and re-added), but a host never reads
// or builds one — it just stores whatever it was given and passes it back.
type CardId = string;

type ReviewError =
  | { code: "pile_item_exists"; kanji: Kanji; canonicalWord: string }
  | { code: "storage_quota" }
  | { code: "read_only" } // account entitlement has lapsed
  | { code: "review_handle_expired" }
  | { code: "review_handle_consumed" }
  // A settings value the scheduler can't work with
  | { code: "invalid_settings"; field: keyof ReviewSettings; reason: string };
  // TODO: How will this be handled?
  | { code: "stale_revision" } // the card changed since it was queried



interface ReviewSettings {
  requestRetention: number
  maximumIntervalDays: number
  enableFuzz: boolean
  enableShortTerm: boolean
  learningStepsMinutes?: number[]
  relearningStepsMinutes?: number[]
  modelWeights: number[] // 21 numbers for latest FSRS
}


interface CardProgress {
  firstReviewedAt?: UnixMs;

  ratingsSummary?: ReviewSummary

  // ===================
  // IMPORTANT: ALL FIELDS BELOW IS FROM THE TS-FSRS LIBRARY
  // ===================

  dueAt: UnixMs;
  stability: number // roughly: days until recall probability drops to the target retention
  difficulty: number // 1..10, higher = harder for this user to remember
  elapsedDays: number // days since lastReviewAt, as of the most recent review
  scheduledDays: number // the interval that was intended between the last two reviews
  learningState: FsrsLearningState
  lastReviewAt?: UnixMs

  // Times this card fell out of "review"/"relearning" and had to be
  // relearned — NOT the same as "number of Again ratings". Pressing Again
  // while still learning a brand-new card is normal and doesn't count here.
  lapses: number

  // stored by FRSRS: total number of times this card has ever been graded
  // redundant with our ratingsCount field, but it's ok
  repetitions: number


  // How to grab the R value programmatically
  // Your current, real-time probability of successfully recalling the card at this exact moment
  // retrievability = scheduler.get_retrievability(card, new Date());
  retrievability: number
}

interface ReviewPileItemView {
  kanji: Kanji;
  word: string; // the word these two cards test, fixed at add time
  reading: CardProgress;
  writing: CardProgress;
}

interface DueCard {
  cardId: CardId;
  kanji: Kanji;
  dueAt: UnixMs;
  // Pass this back as `expectedRevision` to beginReview, so the engine can
  // tell if the card changed after this list was fetched but before it was
  // opened (e.g. graded already in another tab).
  revision: number;
}


interface RatingPreview {
  rating: FsrsRating;
  scheduledAt: UnixMs; // when the card would next be due if this rating is picked
  intervalMs: number; // how far out that is from now, for a label like "3d"
  // TODO: Do we really need both scheduledAt and intervalMs, or do we just need one? Any potential issues with timezone?
}


interface ActiveReview {
  // The token you pass to grade()/cancel(). This — not cardId — identifies
  // *this specific open review*, so opening the same card twice gives out
  // two independent handles with their own expiry.
  handleId: string;
  cardId: CardId;
  kanji: Kanji;
  word: string;
  cardType: CardType;
  previews: Readonly<Record<FsrsRating, RatingPreview>>;

  // When the review was opened. This is for display/telemetry only (e.g.
  // "answered in 4s") — grading doesn't need it, since the frozen `previews`
  // already fix what each rating means.
  openedAt: UnixMs;

  // The handle stops working after this time if it's never graded or
  // cancelled — otherwise a closed/crashed tab would leak it forever.
  expiresAt: UnixMs;
}

interface ReviewsApi {
  settings: {
    // TODO: Discuss what happens if ReviewSettings change while being updated?
    // maybe we should just get the snapshot instead of "watching" this or am I wronG?
    watchCurrent(): QueryStore<ReviewSettings>;
    update(settings: ReviewSettings): Promise<Result<ReviewSettings>>;
  };

  pile: {
    // TODO: Question: do we optional timeZone?: for testing?
    add(input: {kanji: Kanji, word: string}): Promise<Result<ReviewPileItemView>>
    remove(kanji: Kanji): Promise<Result<void>>

    // null = kanji not in pile
    watch(kanji: Kanji): QueryStore<ReviewPileItemView | null>
    // TODO: Confirm: No need to paginate since only less than 3,000 kanji at most
    // Important: Should Memoized component card's update only re-renders its own tile, not the whole grid
    watchAll(): QueryStore<ReviewPileItemView[]>
  }

  watchDueCount(cardType: CardType): QueryStore<number>

  // Used to build a review session. limit: number of cards, asOf?: Testing/tooling escape hatch only
  // what is asOf for?
  getDue(
      input: {cardType: CardType, limit: number, asOf?: UnixMs; }
  ): Promise<Result<DueCard[]>>

  beginReview(
    input: { cardId: CardId; expectedRevision: number; }
  ): Promise<Result<ActiveReview>>

  grade(
    input: { handleId: string; rating: FsrsRating }
  ): Promise<Result<GradeOutcome>>

  cancel(handleId: string): Promise<Result<void>>
}
```

## FAQ

1. TODO: Discusse her What is the CardId ? Why can't we just use Kanji as the Identifier? Is CardId here to track whether it's 'active': true / "deletedAt"? Pros and cons of having CardId?
2. TODO: Walk through the grading process, why getDue() explain why we need to pass expectedRevision in beginReview, what the handleId is for and how having multiple tabs open with the same review work

# Activities

## Primitives

```ts
type ActivityError =
  | { code: "storage_quota" }
  | { code: "read_only" } // account entitlement has lapsed
  // The host should rarely see this in practice — it means a round somehow
  // finished with an impossible shape, e.g. attemptedCount below correctCount.
  | { code: "validation_failed" };
```

## Activity Records

```ts
type SpeekKatakanaEventRecord = {
  type: "speed_katakana_session_completed";
  challengeId: string;
  accuracyVal: number;
  cpmVal: number;
  startedAt: UnixMs;
  endedAt: UnixMs;
  pointerType: "fine" | "course";
  timeZone: IanaTimeZone;
};

type SpeakingPracticeEventRecord = {
  type: "speaking_practice_session_completed";
  challengeId: string;
  startedAt: UnixMs;
  endedAt: UnixMs;
  totalSecondsSpent: number; // TODO: Decide if I count this in the frontend and send
  timeZone: IanaTimeZone;
};

type ReadingPracticeEventRecord = {
  type: "reading_practice_round_completed";
  correctCount: number;
  attemptedCount: number;
  startedAt: UnixMs;
  endedAt: UnixMs;
  timeZone: IanaTimeZone;
};

type WritingPracticeEventRecord = {
  type: "writing_practice_round_completed";
  correctCount: number;
  attemptedCount: number;
  startedAt: UnixMs;
  endedAt: UnixMs;
  timeZone: IanaTimeZone;
};

type PracticeActivityEventRecord =
  | SpeedKatakanaEventRecord
  | SpeakingPracticeEventRecord
  | ReadingPracticeEventRecord
  | WritingPracticeEventRecord;
```

## Daily Summaries

```ts
interface ActivityRecordSummary {
  practice: {
    speedKatakana: number; // sessions
    speaking: number; // sessions
    reading: number; // rounds
    writing: number; // rounds
  };
  reviews: {
    reading: ReviewSummary;
    writing: ReviewSummary;
    // number of items created that day, derived from table, not stored
    newItems: number;
  };
}

// 🚨 IMPORTANT: this is derived from tables not stored
type DailySummary = ActivityRecordSummary & { localDate: LocalDate };

// 🚨 IMPORTANT: this is derived from tables not stored
// This aggregates the number of days you have at least one of these activites
// usually within a specific date range (example last 365 days or year 2026)
interface ActivityDaysSummary {
  practice: {
    speedKatakana: number;
    speaking: number;
    reading: number;
    writing: number;
  };

  reviews: {
    reading: number;
    writing: number;
    newItems: number;
  };
}

type DailySummaryRange = { from: LocalDate; to: TotalDays };

// 🚨 IMPORTANT: this is derived from tables not stored
// Summary given a date range
type AggregatedSummary = ActivityRecordSummary &
  ActivityDaysSummary &
  DailySummaryRange;

// 🚨 IMPORTANT: this is derived from tables not stored
type FirstAttemptsSummary = {
  cakeDay: LocalDate; // first time you did an activity (not when you subscribed)
  practice: {
    speedKatakana: LocalDate;
    speaking: LocalDate;
    reading: LocalDate;
    writing: LocalDate;
  };
  review: {
    writing: LocalDate;
    reading: LocalDate;
  };
};

// 🚨 IMPORTANT: this is derived from tables not stored
type AllTimeSummary = ActivityRecordSummary &
  ActivityDaysSummary &
  FirstAttemptsSummary;
```

## SpeedKatakana and Speaking Practice

```ts
interface ChallengeScore {
  value: number;
  achievedAt: UnixMs; // TODO: decide should we store LocalDate instead or both
}

interface SpeedKatakanaChallengeSummary {
  activityType: "speed_katakana";
  challengeId: number;
  attemptCount: number;
  pointerType: "fine" | "coarse";

  latest: {
    attemptedAt: UnixMs;
    accuracyVal: number;
    cpmVal: number;
  };

  best: {
    accuracy: ChallengeScore;
    cpm: ChallengeScore;
    cpmOverAcc70?: ChallengeScore;
  };
}

interface SpeakingPracticeChallengeSummary {
  activityType: "speaking_practice";
  challengeId: number;
  attemptCount: number;
  totalSecondsSpent: number; // TODO: decide if we should store this
}
```

## Exposed API

```ts
interface ActivityWrite {
  // Rarely needed directly — exists so this exact completion can be told
  // apart from any other, e.g. if it's ever retried, synced twice, or
  // looked up in a bug report.
  eventId: string;
}

interface ActivityApi {
  // Fire-and-forget from the host's point of view
  record(input: PracticeActivityEventRecord): Promise<Result<ActivityWrite>>;

  // Powers a calendar-style heatmap.
  watchDailySummaries(
    input: DailySummaryRange
  ): QueryStore<ActivitiesSummary[]>;

  // Cheap totals and cake day, without pulling the full daily history.
  watchAllTime(): QueryStore<AllTimeSummary>;

  // null means this challenge has never been attempted.
  watchKatakanaChallenge(
    challengeId: number
  ): QueryStore<SpeedKatakanaChallengeSummary | null>;
  watchSpeakingChallenge(
    challengeId: number
  ): QueryStore<SpeakingPracticeChallengeSummary | null>;

  // Powers a full-collection view (e.g. a grid of every challenge at once).
  watchAllKatakanaChallenges(): QueryStore<SpeedKatakanaChallengeSummary[]>;
  watchAllSpeakingChallenges(): QueryStore<SpeakingPracticeChallengeSummary[]>;
}
```

# Authentication, Storage, and Sync API

# Backend Sync Contract

```ts
type SyncOperation =
  | NoteSaveOperation
  | BookmarkAddOperation
  | BookmarkRemoveOperation
  | ReviewSettingsUpdateOperation
  | ReviewPileAddOperation
  | ReviewPileRemoveOperation
  | ReviewGradeOperation
  | PracticeActivityEventRecordOperation;

type ServerEntityChange =
  | { type: "note"; value: CanonicalNote }
  | { type: "bookmark"; value: CanonicalBookmark }
  | { type: "review_pile_item"; value: CanonicalReviewPileItem }
  | { type: "review_card"; value: CanonicalReviewCard }
  | { type: "review_settings"; value: CanonicalReviewSettings }
  | { type: "daily_summary"; value: CanonicalDailySummary }
  | { type: "challenge_summary"; value: CanonicalChallengeSummary };
```

## Proposed Endpoints

```
POST /api/auth/pin/request
POST /api/auth/pin/verify
POST /api/auth/logout
GET  /api/auth/session

POST /api/sync/bootstrap <--- what is this for?
GET  /api/sync/bootstrap/page
POST /api/sync
```

## FAQ

1. Discuss how frontend interacts with backend

## Possible Backend Tables

```md
# study data

- notes
- bookmarks
- review_pile_items
- review_cards
- review_settings
- daily_summaries
- challenge_summaries  
  ❓❓ TODO: Open question. split into katakana_challenge_summaries + speaking_challenge_summaries?

# Common Columns

- account_id
- server_revision
- is_active
- created_at
- updated_at
```

# IndexDB tables and Schema

# Open Questions
