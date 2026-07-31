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
## Design Principles & Constraints

- **Keep dependencies minimal.** Use **DexieJS** for IndexedDB and **TS-FSRS** for spaced repetition. Avoid introducing additional dependencies unless they provide substantial, well-justified value.
- **Offline-first with multi-device synchronization.** The system should work seamlessly while offline and synchronize changes across devices when connectivity is restored.
- **Framework-agnostic architecture.** The core engine must remain independent of any frontend framework so it can be reused across different platforms and UI technologies.
- **Backend is the source of truth.** The backend maintains the canonical state of all study data. IndexedDB stores a local optimistic copy to enable instant interactions while offline. Any provisional local state should be reconciled and, if necessary, overwritten by the canonical backend data during synchronization.
- **Authentication is required.** Users must be signed in to access their study data.
- **Premium controls write access.** Users without an active premium entitlement (or subscription) may view their study data, but all study data remains read-only. Creating, updating, or deleting study data requires an active premium entitlement.
- **Support multiple cached accounts.** IndexedDB may cache study data for up to **two user accounts** on the same device (for example, siblings sharing a computer). Signing out does **not** automatically remove locally cached study data. Instead, users must explicitly choose **"Log Out and Delete All Locally Cached Study Data"**, with a confirmation prompt, since deleting the cache requires a full resynchronization the next time they sign in. As a safeguard, cached study data should be automatically removed if the corresponding account has not signed in for approximately **14 days**.
- **Finite content set.** The application manages a fixed corpus of fewer than **3,000 kanji**. The set is predefined and does not support arbitrary user-created kanji entries.


# Building Blocks

```ts
type UnixMs = number;
type LocalDate = string; // "MM-DD-YYYY"
type UTCTimeStamp = string // "2026-06-04 14:30:00"

type StudyError = { code: "read_only" } // account's premium entitlement has lapsed

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

type Kanji = string;

type ReviewSummary = {
  again?: number
  hard?: number
  good?: number
  easy?: number
}

type UserInfo: {
  accountId: string
  entitlement: true;
}

type EngineAPI {
  version: string
  bookmarks: BookmarksAPI
  notes: NotesAPI
  reviews: ReviewsAPI
  activity: ActivityAPI

  // TODO: Flesh this out
  // auth: {
  //  requestPin({ email: string }): Promise<Result<void>>
  //  verifyPin({ email: string, pin: string })
  //  logout(): Promise<Result<void>>
  //  me(): Promise<Result<UserInfo>>
  // }
  // sync: { now(manualSyncReason?: string): Promise<Result<SyncOutcome>> }
  // storage: { deleteCache(): Promise<Result<void>> } ;
}

interface Engine =
  | { type: 'unavailable'}
  | { type: 'available', version: string, engine: EngineAPI }
```

# Notes

```ts
type NoteError =
  | { code: "unsupported_kanji"; kanji: Kanji }
  | { code: "validation_failed"; reason: "length_exceeded" }
  | { code: "storage_quota" }
  | { code: "read_only" };

// At most, one canonical note exists per kanji.
interface KanjiNoteView {
  kanji: Kanji;
  content: string;
	
  // True when the backend merged a divergent edit from another device into
  // `content`. `content` can be over `maxUtf8Bytes` when this is true
  hasMergedEdit: boolean;
  mergedAt?: UnixMs; // set only alongside hasMergedEdit

  // kanji has a save sitting in the local outbox that the
  // server hasn't acknowledged yet.
  status: "pending-sync" | "synced";
}

type SaveNoteInput = { kanji: Kanji; content: string };

interface NotesApi {
  // The maximum UTF-8 byte size of one saved edit. Check it live against `content` as the person types —
  // `new TextEncoder().encode(content).length` — not just at save time.
  maxUtf8Bytes: number;

  // null means no note has never been written for this kanji
  watch(kanji: Kanji): QueryStore<KanjiNoteView | null>;

  // intentionally no remove() function, set content="" instead
  save(input: SaveNoteInput): Promise<Result<KanjiNoteView | null>>;
}
```

## FAQ

### 1. How do note conflicts actually get resolved?

When two devices each save non-empty, divergent content for the same note while offline, the backend joins both texts into one canonical note, separated by a marker.

### 2. What should the host actually do when hasMergedEdit is true?

Render the note as normal — the merged content, separator included, is genuinely the note now — and show something like "Also edited on another device. Both edits are below." hasMergedEdit itself only flips to false once an edit actually saves, but the host doesn't need to wait for that: it's fine to drop the banner locally as soon as the person starts typing.

### 3. What should the host do if another device's edit arrives while someone is actively editing, not just viewing?
The host should have a separate `edit mode` and `view mode`, Drop back to view mode the moment `watch()` delivers content that differs from what the open draft started from, rather than trying to reconcile a draft that's still being typed into. Show a banner explaining why — **"This note was edited elsewhere. Go back to edit mode and see both versions.**" — and hold the interrupted draft in memory (ordinary host-side state, nothing engine-related) instead of discarding it. Re-entering edit mode pre-fills the textarea with that held draft plus the current content, concatenated; from there it's a normal edit — trim, autosave, done, merging exactly like any other divergent edit.

This has to go through a mode switch rather than resolving on the spot because of timing: by the time `watch()` has something new to deliver, the engine's local copy of the note has already moved past whatever the open draft was based on. A save fired right then — even an automatic, well-intentioned one — would report the new, current revision as its base and look like an uncontested edit to the backend, silently overwriting the other device's text instead of merging with it. Routing through view mode first is what prevents that: nothing can be saved until the person has consciously looked at the current content again, so whatever they eventually save is always genuinely built on it — no revision-tracking required on the host's part. It also needs no new engine method: the host already holds both sides of the comparison — its own draft, and whatever `watch()`` last delivered — without the engine ever needing to know an edit is in progress.

One honest gap: if the person abandons view mode without ever going back to edit — closes the tab, navigates away — the held draft was only ever in memory, so it's gone. Same as any unsaved text in any app; nothing specific to this design.

### 4. Why doesn't Note have a "lastSyncedAt" field?

This is sync-engine state, not note state: it's the same value on every note, so stamping it per-kanji is just duplicating one global number N times.

# Bookmark

```ts
type BookmarkError =
  | { code: "unsupported_kanji"; kanji: Kanji }
  | { code: "storage_quota" }
  | { code: "read_only" };

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

type CardId = string;

type ReviewError =
  | { code: "pile_item_exists"; kanji: Kanji; canonicalWord: string }
  | { code: "storage_quota" }
  | { code: "read_only" }
  | { code: "review_handle_expired" }
  | { code: "review_handle_consumed" }
  // A settings value the scheduler can't work with
  | { code: "invalid_settings"; field: keyof ReviewSettings; reason: string };
  | { code: "stale_revision" } // the card changed since it was queried


//Note, we set review cards limit to unlimited, and new cards added limit to unlimited
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
  createdAt:UTCTimestamp;
  firstReviewedAt?: UTCTimestamp;
  ratingsSummary?: ReviewSummary

  // ===================
  // IMPORTANT: ALL FIELDS BELOW IS FROM THE TS-FSRS LIBRARY
  // ===================

  dueAt: UTCTimestamp;
  stability: number // roughly: days until recall probability drops to the target retention
  difficulty: number // 1..10, higher = harder for this user to remember
  elapsedDays: number // days since lastReviewAt, as of the most recent review
  scheduledDays: number // the interval that was intended between the last two reviews
  learningState: FsrsLearningState
  lastReviewAt?: UTCTimestamp

  // Times this card fell out of "review"/"relearning" and had to be
  // relearned — NOT the same as "number of Again ratings". Pressing Again
  // while still learning a brand-new card is normal and doesn't count here.
  lapses: number

  // stored by FRSRS: total number of times this card has ever been graded
  // redundant with our ratingsCount field, but it's ok
  repetitions: number

  // Your current, real-time probability of successfully recalling the card at this exact moment
  // Get this from the fsrs library = scheduler.get_retrievability(card, new Date());
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
  dueAt: UTCTimestamp;
  // Pass this back as `expectedRevision` to beginReview, so the engine can
  // tell if the card changed after this list was fetched but before it was
  // opened (e.g. graded already in another tab).
  revision: number;
}


interface RatingPreview {
  rating: FsrsRating;

  // intervalMs = scheduledAt - openedAt <--- for a label like "3d"
  scheduledAt: UTCTimestamp; // when the card would next be due if this rating is picked
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
  schedulerVersion: number;
  settingsVersion: number;
  settings: {
    watchCurrent(): QueryStore<ReviewSettings>;
    update(settings: ReviewSettings): Promise<Result<ReviewSettings>>;
    getDefaults(): ReviewSettings;
  };

  pile: {
    // TODO: Discuss: For testing, For add() and remove(),
    // should we optionally pass timeZone?: IanaTimeZone? 
    add(input: {kanji: Kanji, word: string }): Promise<Result<ReviewPileItemView>>
    remove(kanji: Kanji): Promise<Result<void>>

    // null = kanji not in pile
    watch(kanji: Kanji): QueryStore<ReviewPileItemView | null>
    // TODO: Verify: Is there really no need to paginate since only 3,000 pile items at most?
    // Important: Make sure we Memoize component so a specific update only re-renders the relevant components, not the whole grid
    watchAll(): QueryStore<ReviewPileItemView[]>
  }

  watchDueCount(cardType: CardType): QueryStore<number>

  // Used to build a review session. limit: number of cards,
  // TODO: Discuss: For testing, For getDue() 
  // hould we optionally asOf?: 
  getDue(
      input: {cardType: CardType, limit: number }
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

### Why CardId instead of `{ kanji, cardType }` as key

Just for keeping identity separate from attributes on principle. `kanji` and `card_type` are attributes of a card; using them as the primary key means your identity is made of business data.

### Why do we use `CardId` for some inputs and outputs of exposed functions instead of just passing `Kanji + CardType` instead?

kanji/cardType appear on the views because screens show them, never as the key on the identity operations. That keeps identity (opaque, stable) cleanly separated from display (readable, attribute-y), which is the exact discipline that made keeping CardId worthwhile in the first place — so don't undercut it by tuple-keying beginReview

### The grading walkthrough

Each piece earns its place by covering a specific way a review can go stale between listing and grading:

- **`getDue({ cardType, limit })`** returns a snapshot of what's due _right now_, each `DueCard` carrying a `revision` — a version stamp for that card at fetch time. You build the session queue from this.
- **`beginReview({ cardId, expectedRevision })`** — `expectedRevision` is the `revision` you got from `getDue`. The engine checks it against the card's current revision; if they differ (graded in another tab, changed by sync), it returns `stale_revision` and you skip/refetch. If it matches, it computes each rating's next-due time _now_, **freezes those into `previews`**, and hands back a handle. Freezing is why grading is deterministic: whatever the user reads ("Good → 5d") is exactly what they get even if they stare at the card for 30 seconds.
- **`grade({ handleId, rating })`** applies the frozen preview and consumes the handle. It uses `handleId`, not `cardId`, because the handle identifies _this specific open review_ — open the same card twice and you get two independent handles.
- **`expiresAt`** cleans up a handle whose tab crashed or closed without grading or cancelling, so nothing leaks.

The two-tab case, concretely:

1. Tab A and Tab B both `getDue`, both see card X at revision 5.
2. Both `beginReview(X, expectedRevision: 5)` — begin does **not** bump the revision, so both succeed and get handles H_A and H_B, each with its own frozen previews.
3. Tab A `grade(H_A, "good")` → card moves to revision 6, H_A consumed.
4. Tab B `grade(H_B, "good")` → engine sees H_B was opened against revision 5 but the card is now 6 → returns `stale_revision`. Tab B shows "already reviewed elsewhere" and moves on.

So the double-grade safety comes from the revision check at grade time, **not** from locking the card at begin. I'd deliberately avoid locking: locks need expiry, unlock-on-cancel, and still leak on a crash — the revision guard is simpler and crash-safe, since an abandoned handle just expires with no side effects. `review_handle_consumed` is really just a double-submit programming guard, and `review_handle_expired` is the timeout.

### Do we keep "settings.watchCurrent" or make it just a snapshot ?

Keep, but don't bind the form to it. QueryStore is the uniform primitive; making settings the one get() special-case just forces the host to branch. Keep `watchCurrent()` so surfaces that depend on settings stay fresh, but the edit form uses a local draft and treats `update()`'s returned `Result<ReviewSettings>` as the source of truth after save.

### Should we keep a "generationId" to track and "help the user understand why their progress reset." ?

No, you already have the data for the good version of this feature, in `event_log`. Every add, remove, and re-add can be an event with a timestamp. If a user asks "why did my progress reset," the honest, complete answer is reconstructable from the event feed: "you removed this card on Feb 10 and re-added it on Mar 3, which reset it." That's strictly better than a counter — it has the dates, the sequence, the whole story.

### For testing, do we need to optionally have a (1) `asOf` input parameter for `getDue()` (2) `timezone` for `pile.add()` and `pile.remove()`?

TODO

### `pile.watchAll()` is not paginated. Will this potential cause issues for less than 3000 items?

TODO

### How does the stored card state in postgres table or index db interact with ts-fsrs and py-fsrs ?
TODO
### How will we handle merge conflicts for cards given multidevice sync?
TODO
	

### What is `schedulerVersion` for?

Backend and frontend must agree which SRS scheduler algorithm to use. Backend is authoritative so if backend's version is equal or greater, backend can process it. But if frontend's version is greater, then backend will reject events, and frontend will try again later. If frontend is outdated, we can prompt the user to "hard refresh", storing "lastPromptedToHardRefresh" in localstorage so that we won't annoyingly always prompt the user to hear refresh.

### What is `settingsVersions` for?

If the schema of the scheduler's settings has changed, then we must handle backend and frontend mismatch. (For example: Number of weights have changed from 21 to 24)


# Activities

## Primitives

```ts
type ActivityError =
  | { code: "storage_quota" }
  | { code: "read_only" }
  // The host should rarely see this in practice — it means a round somehow
  // finished with an impossible shape, e.g. attemptedCount below correctCount.
  | { code: "validation_failed" };
```

## Activity Records

```ts
// IMPORTANT NOTE: I may actually send more information such as
// activity settings and things like that, which we will store
// in cold storage for research purposes
type EventRecordTimeRange = {
  startedAt: UnixMs;
  endedAt: UnixMs;
  timeZone: IanaTimeZone;
};

type SpeedKatakanaEventRecord = EventRecordTimeRange & {
  type: "speed_katakana_session_completed";
  challengeId: string;
  accuracyVal: number;
  cpmVal: number;
  pointerType: "fine" | "coarse";
};

type SpeakingPracticeEventRecord = EventRecordTimeRange & {
  type: "speaking_practice_session_completed";
  challengeId: string;
};

type ReadingPracticeEventRecord = EventRecordTimeRange & {
  type: "reading_practice_round_completed";
  correctCount: number;
  attemptedCount: number;
};

type WritingPracticeEventRecord = EventRecordTimeRange & {
  type: "writing_practice_round_completed";
  correctCount: number;
  attemptedCount: number;
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
    // 🚨 IMPORTANT: number of items created that day, derived from tables, not stored
    newItems: number;
  };
}

// 🚨 IMPORTANT: this is stored in a table
type DailySummary = ActivityRecordSummary & {
  summaryDate: LocalDate;
  lastUpdatedAt: UTCTimestamp;
};

// 🚨 IMPORTANT: this is derived from tables, not stored
// This aggregates the number of days you have at least one of these activites
// usually within a specific date range (example last 365 days or year 2026)
interface ActivityDaysSummary {
  totalDaysActive: number;
  practice: {
    speedKatakana: number;
    speaking: number;
    reading: number;
    writing: number;
  };

  reviews: {
    reading: number; // total reviews
    writing: number; // total reviews
    newItems: number; // total new items added
  };
}

type DailySummaryRange = { from: LocalDate; totalDays: TotalDays };

// 🚨 IMPORTANT: this is derived from tables, not stored
// Summary given a date range
type AggregatedSummary = ActivityRecordSummary &
  ActivityDaysSummary &
  DailySummaryRange;

// 🚨 IMPORTANT: this is derived from tables, not stored
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
type AttemptedAt = LocalDate;

interface ChallengeScore {
  value: number;
  achievedAt: AttemptedAt;
}

interface SpeedKatakanaChallengeSummary {
  activityType: "speed_katakana";
  challengeId: number;
  attemptCount: number;
  pointerType: "fine" | "coarse";

  latest: {
    attemptedAt: AttemptedAt;
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
  lastAttemptedAt: AttemptedAt;
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

  //
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

## F.A.Q

### 1. Why split the challenges into separate functions? Should we split the tables as well?

The reason to keep them separate isn't the method names, it's that there's no screen that wants them mixed. A katakana challenge summary and a speaking challenge summary share almost no fields — katakana has accuracy/cpm/best-scores, speaking has just attempt count and seconds — and no view renders "all my challenges of both kinds in one list." They're different collection screens. Your options either two tables of single storage table with a discriminator (fewer tables, and the two shapes are small)

# Authentication, Storage, and Sync API

TODO: Fleshout this area

# Backend Sync Types

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

type CanonicalEntities =
  | { type: "note"; value: CanonicalNote }
  | { type: "bookmark"; value: CanonicalBookmark }
  | { type: "review_pile_item"; value: CanonicalReviewPileItem }
  | { type: "review_card"; value: CanonicalReviewCard }
  | { type: "review_settings"; value: CanonicalReviewSettings }
  | { type: "daily_summary"; value: CanonicalDailySummary }
  | { type: "speed_katakana_challenge_summary"; value: CanonicalSpeedKatakanaChallengeSummary };
  | { type: "speaking_practice_challenge_summary"; value: CanonicalSpeakingPracticeChallengeSummary };

```

## Proposed Database Table Schema (by Backend)

TODO: `review_cards` row should have a BUFFER CARD RING (Last 8 review events) (TO BE DISCUSSED)

```
sync_bootstraps
- user_id
- bootstrap_id
- target_revision
- expires_at

daily_summaries
- user_id
- revision
- summary_date (date without timezone, not UTC)
- speed_katakana_attempts
- speaking_attempts
- reading_attempts
- writing_attempts
- review_reading_again
- review_reading_hard
- review_reading_good
- review_reading_easy
- review_writing_again
- review_writing_hard
- review_writing_good
- review_writing_easy

speed_katakana_challenge_summaries
- user_id
- revision
- challenge_id
- pointer_type
- attempt_count
- latest_attempted_at (UTC)
- latest_accuracy
- latest_cpm
- best_accuracy_score
- best_accuracy_timestamp
- best_cpm_score
- best_cpm_timestamp
- best_cpm_acc70_score
- best_cpm_acc70_timestamp

speaking_practice_challenge_summaries
- user_id
- revision
- challenge_id
- attempt_count
- last_attempted_at

review_pile_items
- user_id
- revision
- kanji
- word
- added_on_local (user timezone date) - remove???
- added_at (UTC timestamp)

review_cards
- user_id
- revision
- kanji - remove? can use review pile item
- review_pile_item_id - what if FK in pile item instead?
- card_type (reading, writing)
- is_active
- due_at (UTC)
- stability
- difficulty
- elapsed_days
- scheduled_days
- learning_state (new, learning, review, relearning)
- last_reviewed_at (UTC)
- first_reviewed_at (UTC)
- lapses
- repititions
- again_ratings
- hard_ratings
- good_ratings
- easy_ratings

review_settings
- user_id
- revision
- request_retention
- maximum_interval_days
- enable_fuzz
- enable_short_term
- learning_steps_minutes (null, number[])
- relearning_steps_minutes (null, number[])
- model_weights (number[21])

notes
- user_id
- revision
- kanji
- content (TEXT)
- has_merged_edit
- merged_at (UTC)

bookmarks
- user_id
- revision
- is_active
- kanji
```

## Proposed Endpoints (BY BACKEND DRAFT)

start: POST /api/kanjiheatmap/v1/sync/bootstrap

- request
  - reviewsSettingsVersion (reject if not the same)
  - ADD ONLY IF NEEDED:
    - reviewsSchedulerVersion (TBD)
- response
  - bootstrapId
  - targetRevision
  - expiresAt
  - cursor
  - hasMore

page: GET /api/kanjiheatmap/v1/sync/bootstrap/page

- request (query params)
  - bootstrapId
  - cursor
  - ADD ONLY IF NEEDED:
    - reviewsSettingsVersion (are reviewsSettingsVersion changes backward compatible?)
- response
  - pageRevision
  - cursor
  - hasMore
  - entities[]

## Sync API

sync: POST /api/kanjiheatmap/v1/sync

- request
  - appliedServerRevision
  - syncOperations[]
  - TBD
    - reviewsSchedulerVersion
    - reviewsSettingsVersion
- response
  - cursor
  - hasMore
  - failedOperations[]

page: GET /api/kanjiheatmap/v1/sync

- request
  - appliedServerRevision
  - cursor
- response
  - pageRevision
  - cursor
  - hasMore
  - entities[name=Mithi Sevilla]

## Proposed Endpoints (BY FRONTEND DRAFT)

```
# TODO: Auth endpoints, request and response types

POST /api/sync/bootstrap
GET  /api/sync/bootstrap/page
POST /api/sync
```

### `POST /api/sync/bootstrap`

Request

```ts
type BootstrapRequest = {
  // TODO: Discuss, how we want to handle this
  // do we reject if there's a mismatch?
  clientReviewsSettingsVersion: number;

  // TODO: Do we need to send this? why?
  // clientReviewsSchedulerVersion: number;
};
```

Response

```ts
type BootstrapResponse = {
  bootstrapId: string;
  targetRevision: number; // or pinnedRevision, decide which name
  expiresAt: UTCTimestamp; // finish pages before this

  // "opaque" cursor, does not look like revision
  cursor: number;
  hasMore: boolean;

  // intentionally no approximateEntityCount, pageSize
  // entitlement is handled by auth/me route
  // TODO: Discuss: why we don't need reviewsSchedulerVersion and reviewsSettingsVersion
};
```

### `GET /api/sync/bootstrap/page`

Request

```ts
// Query:
// ?bootstrapId=XXX&cursor=YYYY

type BootstrapPageRequest = {
  bootstrapId: string;
  cursor: string;

  // TODO: Finalize: what if reviewsSettings version changed
  // within the serverRevision range? how to handle in get
};
```

Response

```ts
type BootstrapPageResponse = {
  entities: CanonicalEntities[];

  cursor: string;
  hasMore: boolean;
  // Latest server revision we have pulled
  pageRevision: number;
};
```

Client Loop

```py

POST bootstrap → sessionId, targetRevision

while !done:
  GET page → upsert entities into IndexDB
  localCursor = R

discard bootstrapSessionId

→ steady-state POST /api/sync
```

If another device writes mid-bootstrap, pages stay at pinned R; those writes arrive on the next incremental sync after cursor = R

### `POST /api/sync`

Usage: normal path — push outbox + pull since cursor. Engine sync.now() maps here.

request

```ts
type SyncRequest = {
  appliedServerRevision: number;
  // the outbox, in the order the user performed them (may be empty)
  operations: SyncOperation[];
};
```

response

```ts
type SyncResponse = {
  entities: ServerEntityChange[];
  failedOperations: EventId[];

  // TODO: Pending
  cursor: string;
  // client should immediately sync again with ops=[]
  hasMore: boolean;

  // AFTER applying ops + including pulled changes
  pageRevision: number;
};
```

## FAQ

### Why is the cursor Opaque?

TODO

### What happens if bootstrap session expires before finishing?

TODO

### What happens when server unavailable (503) like for server maintenance?

Frontend will try again to send pending events later

### How does bootstrap work TLDR?

- `POST /api/sync/bootstrap` — _opens_ a bootstrap: server pins "your snapshot is revision R," and hands back R (plus maybe a page count / token). It's a POST because it **creates server-side state** — a pinned cursor the pages read against. GETs shouldn't have that side effect.
- `GET /api/sync/bootstrap/page?...` — pulls each page, all read at the pinned R, so paging never sees a moving target even if another device writes mid-download.
- Done → your cursor = R → switch to `POST /api/sync`.

# Backend Postgresql and IndexDB tables and Schema

- NOTE: Index DB will have an "outbox" table
- TODO: Final schemas here

```md
# study data

- notes
- bookmarks
- review_pile_items
- review_cards
- review_settings
- daily_summaries
- katakana_challenge_summaries
- speaking_challenge_summaries
```

# TODO:

- Discuss final `sync` operations, request and response types
- Discuss `auth` endpoints, request and response types
- Discuss canonicalRecords types
- Discuss operationTypes
- Finalize SQL Database Schemas
- Finalize IndexDB Shemas
- Discuss behavior when versions such as reviewsSchedulerVersion and reviewsSettings version mismatch of backend and frontend, how to handle
