# Review public API

Internal engine/backend mechanics are not here — only what is exposed,
and why each piece exists.

## 1. The public `ReviewsApi`

```ts
// ---- Basic building blocks ----

type UnixMs = number;
type Kanji = string; // a single kanji character

// Opaque. Internally it identifies a kanji + card type + "which attempt at
// this kanji" (in case it was removed and re-added), but a host never reads
// or builds one — it just stores whatever it was given and passes it back.
type CardId = string;

type CardType = "reading" | "writing";
type FsrsRating = "again" | "hard" | "good" | "easy";
type FsrsLearningState = "new" | "learning" | "review" | "relearning";

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

type Result<T> = { ok: true; value: T } | { ok: false; error: ReviewError };

type ReviewError =
  | { code: "pile_item_exists"; kanji: Kanji; canonicalWord: string }
  | { code: "storage_quota" }
  | { code: "read_only" } // account entitlement has lapsed
  | { code: "stale_revision" } // the card changed since it was queried
  | { code: "review_handle_expired" }
  | { code: "review_handle_consumed" }
  // A settings value the scheduler can't work with — see FAQ. `field` names
  // the one that's wrong, so a form can point at it instead of showing a
  // generic failure.
  | { code: "invalid_settings"; field: keyof ReviewSettings; reason: string };

// ---- Settings (shared by both card types) ----

interface ReviewSettings {
  requestRetention: number; // target recall rate, e.g. 0.9 = "aim to remember 90% of cards"
  maximumIntervalDays: number;
  enableFuzz: boolean; // add small random jitter so cards don't all clump on the same day
  enableShortTerm: boolean;
  learningStepsMinutes: readonly number[];
  relearningStepsMinutes: readonly number[];
  modelWeights: readonly number[]; // FSRS's tuning parameters
}

// ---- Pile items (what's actually being studied) ----

// Note: stability + difficulty + lastReviewAt, combined with the request
// retention available from ReviewSettings, is already enough for a host to
// roughly approximate the scheduler's own math. That's an accepted
// tradeoff in favor of showing real review history — not an oversight —
// but the server still remains the only one that actually decides dueAt.
interface CardProgress {
  readonly dueAt: UnixMs;
  readonly learningState: FsrsLearningState;
  readonly stability: number; // roughly: days until recall probability drops to the target retention
  readonly difficulty: number; // 1..10, higher = harder for this user to remember
  readonly firstReviewedAt: UnixMs | null; // null until this card has been graded for the first time
  readonly lastReviewAt: UnixMs | null; // null until this card has been graded for the first time
  readonly elapsedDays: number; // days since lastReviewAt, as of the most recent review
  readonly scheduledDays: number; // the interval that was intended between the last two reviews

  // Times this card fell out of "review"/"relearning" and had to be
  // relearned — NOT the same as "number of Again ratings". Pressing Again
  // while still learning a brand-new card is normal and doesn't count here.
  readonly lapses: number;

  readonly repetitions: number; // total number of times this card has ever been graded

  // Breakdown of `repetitions` by rating.
  readonly totalAgainRating: number;
  readonly totalHardRating: number;
  readonly totalGoodRating: number;
  readonly totalEasyRating: number;
}

interface ReviewPileItemView {
  readonly kanji: Kanji;
  readonly word: string; // the word these two cards test, fixed at add time
  readonly reading: CardProgress;
  readonly writing: CardProgress;
}

// ---- Due queue ----

interface DueQuery {
  cardType: CardType; // one type per query, never "both"
  limit: number;
  // Testing/tooling escape hatch only, bounded to a small window. Not a way
  // for a host to unlock cards before they're actually due.
  asOf?: UnixMs;
}

interface DueCard {
  readonly cardId: CardId;
  readonly kanji: Kanji;
  readonly dueAt: UnixMs;
  // Pass this back as `expectedRevision` to beginReview, so the engine can
  // tell if the card changed after this list was fetched but before it was
  // opened (e.g. graded already in another tab).
  readonly revision: number;
}

// ---- Begin / grade a review ----

interface BeginReviewInput {
  cardId: CardId;
  expectedRevision: number;
}

interface RatingPreview {
  readonly rating: FsrsRating;
  readonly scheduledAt: UnixMs; // when the card would next be due if this rating is picked
  readonly intervalMs: number; // how far out that is from now, for a label like "3d"
}

interface ActiveReview {
  // The token you pass to grade()/cancel(). This — not cardId — identifies
  // *this specific open review*, so opening the same card twice gives out
  // two independent handles with their own expiry.
  readonly handleId: string;
  readonly cardId: CardId;
  readonly kanji: Kanji;
  readonly word: string;
  readonly cardType: CardType;
  readonly previews: Readonly<Record<FsrsRating, RatingPreview>>;
  // When the review was opened. This is for display/telemetry only (e.g.
  // "answered in 4s") — grading doesn't need it, since the frozen `previews`
  // already fix what each rating means.
  readonly openedAt: UnixMs;
  // The handle stops working after this time if it's never graded or
  // cancelled — otherwise a closed/crashed tab would leak it forever.
  readonly expiresAt: UnixMs;
}

interface GradeReviewInput {
  handleId: string;
  rating: FsrsRating;
}

interface GradeOutcome {
  // A unique id for this one grading event. Not needed for everyday UI work
  // — it exists so this exact grade can be told apart from any other, e.g.
  // if it's ever retried, synced twice, or looked up in a bug report.
  readonly eventId: string;
  readonly cardId: CardId;
  // An immediate best guess, so the UI can update without waiting on the
  // network. The server may correct this slightly once sync completes.
  readonly provisionalCard: DueCard;
}

// ---- The API itself ----

interface ReviewsApi {
  settings: {
    watchCurrent(): QueryStore<ReviewSettings>;
    update(settings: ReviewSettings): Promise<Result<ReviewSettings>>;
  };

  pile: {
    // null means this kanji isn't in the pile.
    watch(kanji: Kanji): QueryStore<ReviewPileItemView | null>;

    // Powers the whole-collection "kanji heatmap" view. Bounded by the size
    // of the review catalog (a few thousand kanji at most), so it needs no
    // paging — but the host should memoize each tile component so that one
    // card's update only re-renders its own tile, not the whole grid.
    watchAll(): QueryStore<readonly ReviewPileItemView[]>;

    // Adding the same kanji with the exact same word twice (e.g. a double
    // tap) returns the existing item rather than creating a duplicate, and
    // doesn't count as a second add for `totalReviewItemsAdded` — see FAQ.
    add(input: {
      kanji: Kanji;
      word: string;
    }): Promise<Result<ReviewPileItemView>>;

    // Starts over from scratch if this kanji is added again later — there's
    // no way to restore the old schedule.
    remove(kanji: Kanji): Promise<Result<void>>;
  };

  // Live count for a badge, e.g. "12 due".
  watchDueCount(cardType: CardType): QueryStore<number>;

  // Used to build a review session.
  getDue(input: DueQuery): Promise<Result<DueCard[]>>;

  beginReview(input: BeginReviewInput): Promise<Result<ActiveReview>>;
  grade(input: GradeReviewInput): Promise<Result<GradeOutcome>>;
  cancel(handleId: string): Promise<Result<void>>;
}
```

## 2. F.A.Q

**What's a `QueryStore`, and why doesn't `watch()` just give me the data
directly?**
Because the data can change out from under you — a sync from another device,
a grade in another tab. A `QueryStore` is a small live connection: you read
the current snapshot, and you get told when a new one is ready, instead of
having to ask over and over.

**What do "loading / ready / failed" mean?**
"loading" is the first read before anything is on disk yet. "ready" means
there's an answer, which is itself either a success or a normal, expected
error (see the next question). "failed" means something broke that isn't a
normal error — a bug, corrupted storage, something like that.

**What are `diagnosticId` and `retryable` for?**
When a "failed" happens, you don't get a specific reason (there isn't a
sensible list of reasons a UI should react to). `diagnosticId` is just a
short reference code to show the person or put in a bug report. `retryable`
tells you whether showing a "Try again" button is worth it.

**What's the difference between a "failed" query and an `error` inside a
`Result`?**
A `Result` error is expected and part of normal use — "this kanji is already
in your pile with a different word," "you're out of storage." A "failed"
query is unexpected — the kind of thing that shouldn't happen and that
someone would want to investigate.

**What makes settings invalid, and why does the engine check them at all?**
Because these values go straight into the scheduler, and bad ones don't fail
loudly — they quietly produce nonsense intervals. A retention target of 5
(rather than 0.9), a negative maximum interval, an empty learning-steps
list, or the wrong number of `modelWeights` for the scheduler in use are all
shapes the algorithm will accept and then misbehave on. `update()` rejects
them with `invalid_settings` before anything is stored, naming the field so
a settings form can mark that input rather than showing one generic error.
`reason` is a short plain-language explanation ("must be between 0.7 and
0.99") that a form can show as-is. The host doesn't need its own copy of the
valid ranges to call this safely — though bounding a slider is still nicer
than letting someone submit and be told no.

**Why is `CardId` a meaningless string instead of just the kanji?**
Because a kanji can be removed from the pile and added back later, starting
fresh. `CardId` quietly captures "which attempt" a given card belongs to, so
an old screen that's still open can't accidentally grade the wrong attempt.
You never need to read it — just hand back whatever you were given.

**What are `revision` and `expectedRevision` for?**
A safety check. When you fetch a due list, each card comes with a `revision`
number. When you open one of those cards, you send that number back. If the
card changed in the meantime (say, another tab already reviewed it), opening
fails instead of showing you a preview for a card that's already moved on.

**Why does an open review expire (`expiresAt`)?**
So that closing a tab, or a crash, doesn't leave a review "open" forever.
If nobody grades or cancels it in time, it just quietly stops being valid.

**Why doesn't grading need to know the kanji or card type — just a handle
ID?**
Because opening a review already captured all of that. Passing it again
would just be one more way for the app and the engine to disagree about
which card is meant.

**What does "provisional" mean in the grade result?**
It's a quick, local best-guess at the card's new due date, shown immediately
so the screen doesn't have to wait for the network. Once the result reaches
the server, the real value might land a little differently — usually
identical, occasionally off by a bit — and the display quietly catches up.

**Why is there no way to add, watch, or rename many kanji at once?**
On purpose. Adding one kanji at a time nudges someone to actually pick words
deliberately, rather than mass-importing a list they haven't really studied
yet. Watching many at once was removed because nothing actually needs it: a
list screen can watch each kanji individually and just make sure each row
only re-renders itself. Renaming a card's word in place was removed too — if
you want a different word, remove and add again; it's one more UI step in
exchange for one less special case to reason about.

**Why are some fields marked `readonly` and others aren't?**
Two different reasons, for two different kinds of shape. First: anything
you only ever _receive_ from the engine — a card's progress, an open review,
a grade result — has every field marked `readonly`, because there's never a
good reason for your code to reassign a piece of it after the fact. Second:
a _list_, wherever one shows up, gets marked readonly on the list itself
(not just its items) when it comes from a live `watch`/`watchAll` — a naive
implementation may hand every open screen the same array, and calling
`.push()` or `.sort()` on it in place would silently change what every other
screen sees too. A list from a one-time call like `getDue` is your own
private copy, so it's fine to sort or filter that one yourself. Things you
build yourself to send to the engine (a query, an add request) aren't marked
readonly at all, since you're the one constructing them fresh each time.

**Why is it called `repetitions` and what does it count?**
It counts every grade this card has ever been given, regardless of rating.
It deliberately does _not_ mean "successful reviews since the last lapse,".

**What happened to `bestStreak` and `currentStreak` ("how many reviews
since you last rated Again")?**
Cut, confirmed — not needed. Unlike the history fields above, nothing in the
canonical design tracks this today, so keeping it out avoids adding new
engine-side bookkeeping for a feature that isn't a priority right now.

**What about per-rating totals (`totalHardRating` and similar)?**
Added — this one was cheap, since the backend already keeps a per-rating
breakdown internally.

**Open question: do we need both `scheduledAt` and `intervalMs` on a rating
preview?**
Maybe not — as specified today, one can be computed from the other, so
keeping both is duplicate information. It's been raised that time zones
might be a reason to keep both (e.g. if due dates ever get aligned to a
person's local day rather than a flat count of hours), but nothing in the
engine currently does that, so this is still open. Flagging it here rather
than deciding it silently.
