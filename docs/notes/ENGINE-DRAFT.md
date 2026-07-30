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
- At most two accounts can be be cached in indexdb at a time (for two siblings sharing computers). Logging out doesn't automatically delete there data in the local unless they explicitly say "Logout and Delete all Locally Cached Study Data". Although the data will be deleted locally if they do not log-in within 14 days or so.
- Only a fixed number of kanji is available. Less than 3000 kanjis.

# Building Blocks

```ts
type UnixMs = number;
type Kanji = string;
type LocalDate = string; "MM-DD-YYY" or something

type StudyError = { code: "read_only" } // account entitlement has lapsed

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
  | { code: "read_only" };

// One canonical note exists per kanji.
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

  // below if we want to show the following in the view
  localUpdatedAt: UnixMs; // "edited two minutes ago"
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

### 1. How do note conflicts actually get resolved?

When two devices each save non-empty, divergent content for the same note while offline, the backend joins both texts into one canonical note, separated by a rule and an invisible marker, ordered so every device that applies the same pair produces byte-identical output.

### 2. What should the host actually do when hasMergedEdit is true?

Render the note as normal — the merged content, separator included, is genuinely the note now — and show something like "Also edited on another device. Both edits are below." hasMergedEdit itself only flips to false once an edit actually saves, but the host doesn't need to wait for that: it's fine to drop the banner locally as soon as the person starts typing.

### 3. What should the host do if another device's edit arrives while someone is actively editing, not just viewing?

What should the host do if another device's edit arrives while someone is actively editing, not just viewing? If the host has a separate edit mode and view mode, the safe pattern is to drop back to view mode the moment watch() delivers content that differs from what the open draft started from, rather than trying to reconcile a draft that's still being typed into. Show a banner explaining why — "This note was edited elsewhere. Click and go back to edit mode and see both versions." — and hold the interrupted draft in memory (ordinary host-side state, nothing engine-related) instead of discarding it. Re-entering edit mode pre-fills the textarea with that held draft plus the current content, concatenated; from there it's a normal edit — trim, autosave, done, merging exactly like any other divergent edit.

This has to go through a mode switch rather than resolving on the spot because of timing: by the time watch() has something new to deliver, the engine's local copy of the note has already moved past whatever the open draft was based on. A save fired right then — even an automatic, well-intentioned one — would report the new, current revision as its base and look like an uncontested edit to the backend, silently overwriting the other device's text instead of merging with it (see "How do note conflicts actually get resolved?" above). Routing through view mode first is what prevents that: nothing can be saved until the person has consciously looked at the current content again, so whatever they eventually save is always genuinely built on it — no revision-tracking required on the host's part. It also needs no new engine method: the host already holds both sides of the comparison — its own draft, and whatever watch() last delivered — without the engine ever needing to know an edit is in progress.

One honest gap: if the person abandons view mode without ever going back to edit — closes the tab, navigates away — the held draft was only ever in memory, so it's gone. Same as any unsaved text in any app; nothing specific to this design.

### 4. Why did we remove Note's "lastSync" ?

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


// Opaque. Internally it identifies a kanji + card type + "which attempt at
// this kanji" (in case it was removed and re-added), but a host never reads
// or builds one — it just stores whatever it was given and passes it back.
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

  // intervalMs = scheduledAt - openedAt <--- for a label like "3d"
  scheduledAt: UnixMs; // when the card would next be due if this rating is picked
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
    watchCurrent(): QueryStore<ReviewSettings>;
    update(settings: ReviewSettings): Promise<Result<ReviewSettings>>;
    getDefaults(): ReviewSettings;
  };

  pile: {
    // should we optionally pass timeZone?: IanaTimeZone? only as a test hook. but probably not needed
    add(input: {kanji: Kanji, word: string }): Promise<Result<ReviewPileItemView>>
    remove(kanji: Kanji): Promise<Result<void>>

    // null = kanji not in pile
    watch(kanji: Kanji): QueryStore<ReviewPileItemView | null>
    // TODO: need to Confirm: No need to paginate since only 3,000 pile items at most?
    // Important: Make sure we Memoize component so a specific update only re-renders the relevant components, not the whole grid
    watchAll(): QueryStore<ReviewPileItemView[]>
  }

  watchDueCount(cardType: CardType): QueryStore<number>

  // Used to build a review session. limit: number of cards,
  //  should we optionally asOf?: Testing/tooling escape hatch only probably not needed
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

### 1. Why CardId instead of `{ kanji, cardType }` as key

The only thing forcing an opaque id over that tuple in case it was removed and re-added. Lets the engine soft-delete old cards (`is_active = false`) for history/sync without key collisions. Re-add starts fresh → the new cards must be distinguishable from the old soft-deleted ones (same kanji + type), so you need a generation marker → keep CardId, opaque. My lean: reset-on-re-add is the more intuitive behavior ("I removed it, I want a clean slate"), and the opaque id costs the host almost nothing.

### 2. The grading walkthrough

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

### 3. Do we keep "settings.watch current" or make it just a snapshot ?

settings.watchCurrent — keep watch, don't bind the form to it. QueryStore is your uniform primitive; making settings the one get() special-case just forces the host to branch. Keep watchCurrent() so surfaces that depend on settings stay fresh, but the edit form uses a local draft and treats update()'s returned Result<ReviewSettings> as the source of truth after save.

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
type EventRecordTimeRange = {
  startedAt: UnixMs;
  endedAt: UnixMs;
  timeZone: IanaTimeZone;
};

type SpeekKatakanaEventRecord = EventRecordTimeRange & {
  type: "speed_katakana_session_completed";
  challengeId: string;
  accuracyVal: number;
  cpmVal: number;
  pointerType: "fine" | "coarse";
};

type SpeakingPracticeEventRecord = EventRecordTimeRange & {
  type: "speaking_practice_session_completed";
  challengeId: string;
  totalSecondsSpent: number; // TODO: Decide if we want this
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
    // 🚨 IMPORTANT: number of items created that day, derived from table, not stored
    newItems: number;
  };
}

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
    reading: number; // total reviews
    writing: number; // total reviews
    newItems: number; // new items added
  };
}

type DailySummaryRange = { from: LocalDate; totalDays: TotalDays };

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
type AttemptedAt = LocalDate; // TODO: decide should we store UnixMs or as LocalDate instead or both
/* Suggestion by LLM
  You only ever show "best CPM, set Mar 3," never "2 hours ago," so you don't need instant precision. And LocalDate frozen at achievement time is travel-stable, whereas deriving the day from UnixMs at render risks the date shifting when the user changes timezone. Never store both — that just invites the two to disagree.
   */

interface ChallengeScore {
  value: number;
  achievedAt: AttemptedAt; // TODO: decide should we store UnixMs or as LocalDate instead or both
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

## F.A.Q

### 1. Why split the challenges into separate functions? Should we split the tables as well?

The reason to keep them separate isn't the method names, it's that there's no screen that wants them mixed. A katakana challenge summary and a speaking challenge summary share almost no fields — katakana has accuracy/cpm/best-scores, speaking has just attempt count and seconds — and no view renders "all my challenges of both kinds in one list." They're different collection screens. Your options either two tables of single storage table with a discriminator (fewer tables, and the two shapes are small)

# Authentication, Storage, and Sync API

TODO: Fleshout this area

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

POST /api/sync/bootstrap
GET  /api/sync/bootstrap/page
POST /api/sync
```

## FAQ

## 1. There are two ways to structure bootstrap, and they differ by exactly whether that POST exists

**Option A — two-step, with the POST (pinned snapshot).**

- `POST /api/sync/bootstrap` — _opens_ a bootstrap: server pins "your snapshot is revision R," and hands back R (plus maybe a page count / token). It's a POST because it **creates server-side state** — a pinned cursor the pages read against. GETs shouldn't have that side effect.
- `GET /api/sync/bootstrap/page?...` — pulls each page, all read at the pinned R, so paging never sees a moving target even if another device writes mid-download.
- Done → your cursor = R → switch to `POST /api/sync`.

**Option B — just the paged GET, no opening POST.**

- `GET /api/sync/bootstrap/page?cursor=...` — page straight through, each page reads at whatever "now" is. No pinned snapshot.
- Risk: a write landing between page 1 and page 5 can make paging slightly inconsistent — but it self-heals on your first incremental `/api/sync`, since that pulls anything you missed. So the `POST /api/sync/bootstrap` line exists _only_ to buy the pinned-snapshot guarantee. If you drop it, you keep just `GET /api/sync/bootstrap/page` + `POST /api/sync`.

## 2. TODO: Discuss how frontend interacts with backend

# Backend Postgresql and IndexDB tables and Schema

- NOTE: Index DB will have an "outbox" table
- TODO: Final schemas here

## Possible Backend Tables

```md
# study data

- notes
- bookmarks
- review_pile_items
- review_cards
- review_settings
- daily_summaries
- katakana_challenge_summaries + speaking_challenge_summaries (maybe combine to just one table each will have a fixed size just 200 challenges each)

# Common Columns

- account_id
- server_revision
- is_active
- created_at
- updated_at
```

# Open Questions

TODO
