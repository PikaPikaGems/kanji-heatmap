I am designing a "StudyEngine" typescript package for Kanji Heatmap. It should be framework agnostic and should not be not be coupled with presentation logic such as ReactJs. Below are some of my thoughts. Please help me iron this out, flesh it out and polish it and make it concrete for implementation. these are not set in stone. I have made study engine plans before but the architecture is not what I want, so I'm building a new one from scratch from the ground up. Please do not reference them and think about this as if they never existed.

Please ask many questions and clarifications. When designing this feature. Create a lot of mermaid diagrams.

This "StudyEngine" is responsible for authenticating the user, storing and manipulating the user data of authenticated user, and syncing these data with the baackend.

This StudyEngine is competely optional and should have very loose coupling from Kanji Heatmap as a core application. Any developer should be download kanji heatmap locally without needing to download StudyEngine and it should not be downloaded by default.

# Proposed Whole system

The system has three separately owned parts:

Kanji Heatmap — the public GPLv3 React application.
kh-study-engine — a separate public, GPL-compatible repository.
Private backend — authentication, entitlement, storage, and sync.

Application components never import `kh-study-engine` directly.

StudyEngine is framework-independent. It does not depend on React, Wouter, Tailwind,
or Kanji Heatmap components.

## Selecting an engine

Application code imports one virtual module:

```ts
import { createStudyEngine } from "virtual:study-engine";
```

Vite resolves it using:

```env
KH_STUDY_ENGINE_ENTRY=/absolute/or/relative/path/to/dist/index.js
```

Selection rules:

- Variable not set: use the no-op engine.
- Configured file exists: use that engine.
- Configured file is missing or invalid: warn and use the no-op.
- Unsupported API version: warn and use the no-op.

Selection happens in build configuration. React components contain no engine
selection branches.

## Contributor and custom-engine flow

Normal development uses the no-op:

```bash
pnpm install
pnpm dev
```

A developer can build any compatible local engine:

```bash
cd ../my-study-engine
pnpm install
pnpm build

cd ../kanji-heatmap
KH_STUDY_ENGINE_ENTRY=../my-study-engine/dist/index.js pnpm dev
```

They do not need the official engine or production build.

## PikaPikaGems production flow

Cloudflare Pages runs:

```bash
pnpm build:production
```

Production environment variables provide:

```env
KH_STUDY_ENGINE_VERSION=v1.2.0
KH_STUDY_ENGINE_COMMIT=immutable-commit-sha
KH_STUDY_ENGINE_SHA256=expected-archive-checksum
```

The build script:

1. Downloads the pinned public `kh-study-engine` GitHub release.
2. Verifies its commit and SHA-256 checksum.
3. Extracts it under `.vendor/kh-study-engine`.
4. Installs its locked dependencies.
5. Builds the engine.
6. Builds Kanji Heatmap with `KH_STUDY_ENGINE_ENTRY` pointing to it.

The engine becomes part of normal hashed Vite assets and works with the PWA
offline.

If preparation fails, the build warns and uses the no-op. Production
monitoring alerts when the deployed engine reports `unavailable`.

# Some Important Features of StudyEngine

1. The app is offline first, and requires multi-device syncing. The merge conflicts resolution of SRS reviews will be discussed in its own section
2. User Authentication and Premium Features Entitlement checks with a specified backend.
3. Ability to (a) save bookmark kanjis (b) save notes regarding specific kanjis (c) store user activity information for displaying activity statistics for the "Practice Games" found in "/speed-katakana", "/writing-practice" and "/reading-practice". And a new (not yet implemented feature) called "/speaking-practice" or "/sentence-shadowing"
4. Flashcards with Spaced Repetition System (FSRS).
5. 5. Login and "Premium Feature Access" is required for reviews, bookmarks, history, notes, and sync

# Other Rules

1.  One Markdown note exists per kanji.
2.  You can take a look at the current local storage and our "/dashboard" to see which statistic we are currenly showing and displaying. Practice Games history stores device-scoped summaries, not session histories. We may still send session histories to the backend (example { sessionEndTimestamp, sessionStartTimeStamp, sessionType, sessionSettings }) etc etc, will be sent to the backend, but they will not be stored in the hot user sql database. They will directly be stored in cloudflare cold storage. User Activities and Statistics such as "Katakana Session StartTimestamp and EndTimestamp" will be sent to the backend, but they will not be stored in the hot user sql database. They will directly be stored in cloudflare cold storage.

## Architecture and Libraries to be used

1. We have our own simple authentication system. To login, the user provides their email and we send them a one-time pin that expires. We show them a "please provide your pin" prompt and it they type the correct pin, they will be logged in
2. Our backend is in python / fast-api. We have a jamstack architecture meaning the frontend is stored at FRONTENDEXAMPLE.com and backend is stored in BACKENDEXAMPLE.com we proxy using cloudflare functions FRONTENDEXAMPLE.com/api . frontend is hosted in cloudflare
3. Our backend uses Postgres SQL database, cloudflare coldstorage R2, and redis, Backend might be in render or heroku
4. The spaced repetition library we will use are https://github.com/open-spaced-repetition/ts-fsrs and https://github.com/open-spaced-repetition/py-fsrs
5. We will store the user data locally indexdb and use https://github.com/dexie/Dexie.js/ to manipulate it
6. Do NOT add CRDTs or WebSockets

## FSRS Specific Rule

1. The number of kanji available for review are fixed. Around 2,300 kanji only. Other kanjis aside from the selected ones are not included
2. One review-pile item exists per kanji.
3. Each pile item owns one reading card and one writing card. You do review and rate each caard independently.
4. When you addToReviewPile or deleteFromReviewPile, both cards will be created or deleted respectively, you cannot create or delete them independently, but you do review them independently.
5. Reading and writing share one FSRS settings document.
6. There are no daily new-card or review limits.
7. We will send all event logs to the backend but they usually will not be stored in a hot sql row, they will go to cold storage. We will store

```
/**
 * Account-wide settings shared by recognition and production.
 */
export interface ReviewSettings {
  requestRetention: number;
  maximumIntervalDays: number;
  enableFuzz: boolean;
  enableShortTerm: boolean;
  learningStepsMinutes: number[];
  relearningStepsMinutes: number[];
  modelWeights: readonly number[];
}

# There are no newCardsPerDay or maximumReviewsPerDay settings.
```

## Proposed User Data to be Saved in the Database (not set in stone)

- notes
- bookmarks
- speed-katakana-sessions
  - challengeId
    - deviceId
      - total attempts count
      - current
        - speedValue
        - accuracyValue
        - timestamp
      - best
        - speed: { timestamp, value }
        - accuracy: : { timestamp, value }
        - speedWithAccuracyOver70: { timestamp, value }
- speaking-practice-sessions
  - total attempts count
  - lastAttemptTimestamp
- Daily Practice Statistics history
  - date
  - lastUpdatedAt
  - speedKatakana
    - deviceId
      - total sessions count
      - lastUpdatedTimestamp
  - speakingPractice
    - total sessions count
    - lastUpdatedTimestamp
  - writingPractice
    - total rounds count
    - - lastUpdatedTimestamp
  - readingPractice
    - totalRoundsCount
    - - lastUpdatedTimestamp
- FSRS Settings Snapshots
  - version number
    - createdAt
    - FSRS Settings
- Kanji Review Items
  - Writing
    - Current Card State
    - Last 6 - 8 review events (deviceId logged)
  - Reading
    - Current Card State
    - Last 6 - 8 review events (deviceId logged)

## Proposed API

```
POST /api/auth/pin/request
POST /api/auth/pin/verify
POST /api/auth/logout
GET  /api/auth/session
POST /api/sync
GET  /api/sync/bootstrap
```

## Proposed Study Engine Exposed functions

## Auth

1. studyEngine.auth.requestPin()
2. studyEngine.auth.verifyPin()
3. studyEngine.auth.sessionStatus()
4. studyEngine.auth.logout()
5. studyEngine.auth.refreshSession()

## Practice Activity

1. studyEngine.practiceHistory.logEvent()

- example argument: { type: "speed-katakana", payload: Record<string, string | number>}

2. studyEngine.activity.getChallengeStatistics()

- example input : { type: 'speaking-practice-session', payload: { challengeIdArray: [] } }

3. studyEngine.activity.dailySummary(from: Date, to: Date)

## Reviews

1. studyEngine.reviews.settings.current()
2. studyEngine.reviews.settings.update()
3. studyEngine.reviews.settings.all()
4. studyEngine.reviews.addToPile(kanji)
5. studyEngine.reviews.RemoveFromPile(kanji)
6. studyEngine.reviews.getCardInfo(kanjiArray: string[], cardType: 'writing' | 'reading' | 'both' )
7. studyEngine.reviews.getTotalDueCount()
8. studyEngine.reviews.getDueKanjis(limit: 10, cardType: 'writing' | 'reading'): string[] (array of kanjis)
9. studyEngine.reviews.preview(kanji, carType): { again: timeInMilliseconds, normal: timeInMilliseconds, easy: timeInMilliseconds, hard: timeInMilliseconds}
10. studyEngine.reviews.rate(kanji, cardType, rating: 'again' | hard' | 'normal' | 'easy' )
11. studyEngine.reviews.dailySummary(from: Date, to: Date)

## Notes

1. studyEngine.notes.updateOrCreate(kanji, notesContent)
2. studyEngine.notes.delete(kanji)
3. studyEngine.notes.get(kanji)

## Bookmarks

1. studyEngine.bookmarks.add(kanji)
2. studyEngine.bookmarks.delete(kanji)
3. studyEngine.bookmarks.getAll() # should this be paginated?

# How the current Kanji Heatmap Repository Snapshot will be modified

Currenly, on local storage we are saving

- bookmarked kanji info
- notes information per kanji
- User statistics of three sames games:
  "/speed-katakana", "/writing-practice" and "/reading-practice"

These information are currently being used by components in "/dashboard". The mentioned user data will deleted from local storage and not migrated for simplicity. Moving forward, these features will require user authentication and stored in indexdb.

====================================

# PFSRS Design Decisions Discussion. Summary: StudyEngine offline-first sync design (Tentative)

## Core architecture decision

**Reviews are facts, card state is a cache.** A review ("at 9:14, this device, this card, this rating") never conflicts with another review — two devices reviewing offline just each know a fact the other doesn't. The current FSRS state of a card (due date, stability, difficulty) is a derived value computed from those facts. This reframe is what makes multi-device merging tractable at all, and every other decision below follows from it.

## 1. Merge conflict resolution — rejected, then locked in

**Rejected: "highest difficulty wins."** Difficulty rises when you fail and falls when you succeed, so this rule silently equals "the device where you did worse wins," and it discards the losing device's reviews entirely — including reviews that should have counted. Same flaw, differently dressed, in "earliest due date wins": due date is just a function of rating, so it's the same biased rule.

**Locked in: hybrid of replay + last-writer-wins, decided per-card by data completeness, not by a fixed time window.**

- Each card row carries a small ring buffer (~6 slots) of its most recent reviews.
- At merge time: if the buffered + incoming reviews form a _complete_ history back to the last point all devices agreed, **replay** — recompute FSRS state by feeding all reviews through in true chronological order. This is provably exact.
- If history is incomplete (buffer overflowed, very long offline gap), **fall back to last-writer-wins by most recent `reviewedAt`.**

**Rationale for LWW as the fallback, not a table-based full replay:**

- LWW-by-recency is _unbiased_ — errors go either direction randomly, unlike difficulty-wins which is systematically biased.
- FSRS is a feedback loop: a slightly wrong difficulty/stability gets corrected within 1-2 subsequent reviews (schedule too generous → user fails → difficulty rises → self-corrects). Errors don't compound.
- Anki — the most-used SRS in the world, decades of operation — resolves the analogous conflict by last-writer-wins on the card row and functions fine. This was direct evidence against over-engineering this piece.
- Estimated real-world impact: conflicts only occur when the same card is touched on two devices between syncs (a few % of reviews for multi-device users, 0% otherwise); when they occur, the error is ~10-20% on the next interval; it heals in 1-2 reviews. Small × small × short-lived.

**Rationale for the ring buffer over a fixed time window:** conflicts cluster on cards in active rotation (especially learning-step cards reviewed multiple times a day), not on calendar time. A review-count-based buffer naturally covers "a day or two" for hot cards and "weeks" for mature ones — exactly the right weighting — for zero additional rows, versus a 7/14/30-day event table costing millions of rows and ongoing partition/cleanup maintenance for marginal extra coverage (~99% vs ~99.9%).

**Settings resolve differently than reviews:** settings are a preference, not a fact — last-writer-wins by `updatedAt` is simply correct there, no replay needed. When replaying reviews that span a settings change, replay the whole (short) merge window under the _winning_ settings version rather than switching mid-replay per-event — simpler, and consistent with the "settings apply forward only" rule since the window being reinterpreted is days, not years of history.

## 2. What data is stored, where, and for how long

**Rejected: a full event-log table** (the originally suggested event-sourcing design), whether kept for 30 days, 14, 7, or 1. Rationale for rejecting all fixed windows: the ring buffer achieves equivalent-or-better merge coverage at zero ongoing rows and zero operational burden (no partitioning, no nightly retention jobs). The event table was appealing mainly when weight-retraining was still in scope; once training was explicitly ruled out, the correctness-only case for it was too weak to justify the storage and ops cost.

**Locked in — Postgres holds only bounded, per-account data:**

- `cards`: FSRS state, due date, ring buffer, **per-device counter map** (rating counts, review counts, lapse counts keyed by small device slot, not UUID) + denormalized totals for queryability (leech detection etc.)
- `daily_activity`: per user/device/day snapshot — keeps exact daily stats even under LWW schedule resolution
- `settings`, `devices`, `users`: small, fixed-size

This table set is essentially flat in size per user and never grows with account age.

**Per-device counter map rationale:** counters (review count, lapse count, rating counts) are additive, so each device writing only its own slot means no conflict is even possible, and re-applying the same payload is harmless (idempotent by construction) — a genuine improvement over an increment-based sync. This preserves exact stats even when the _schedule_ falls back to LWW and "loses" a device's contribution to the due-date calculation.

**Locked in — cold archive to R2, decoupled from the hot path:**

- Buffered in Redis, flushed hourly (not per-event, to avoid per-write R2 costs), written fire-and-forget so it can never block or fail a sync.
- Rows are "fat": include prior state (elapsed days, prior stability/difficulty/state, settings version) so the archive is self-contained and usable for future weight-fitting without needing to replay full account history.
- **No user identifier, date-only (not exact) timestamps** — this makes the archive genuinely anonymous, not merely pseudonymous, sidesteps GDPR erasure obligations by construction, and matches the stated privacy stance (no promise to delete, but no traceability either).
- Cost is trivial (~cents/month at 15-25x compression); the reason to keep it is _optionality_ — history can't be reconstructed retroactively if you decide later you want it, whereas deleting an unused archive costs nothing.

**Redis's role is explicitly limited** to the archive buffer, login OTP storage, and rate limiting — never a source of truth, since it's not durable.

## 3. Sync API

**Locked in: two endpoints, as originally proposed.**

- `GET /api/sync/bootstrap` — one-shot full download for a new/wiped device: all current card states + counters + ring buffers, settings, a fresh `deviceId` if needed, and an opaque `serverCursor`. No history included by design — new devices don't need it.
- `POST /api/sync` — push-and-pull in one round trip: device sends its cursor, unsynced reviews (with `deviceSequence` for idempotency and `settingsVersion` for correct replay), and any changed settings; server merges (per section 1 and 2 logic) inside one transaction and returns updated card states, new cursor, and settings if changed.

**Key mechanics locked in:**

- **Idempotency** via monotonic `deviceSequence` per device — safe to blindly retry a failed request.
- **Sync triggers:** app launch, regained connectivity, end of review session, periodic debounce during active study, on settings change — never per-single-review (the outbox exists to batch).
- **Entitlement gates syncing, not studying** — a lapsed subscription returns 402 but the device keeps working offline and queuing an outbox; resubscribing drains it. Never discard unsynced reviews over billing state.
- **Clock skew guard:** clamp future-dated client timestamps at ingest; break ties deterministically by `deviceId` + `deviceSequence`, since replay ordering depends on trustworthy timestamps.
- **Mid-review safety:** don't let a returned server state overwrite a card the user currently has on screen — apply after grading.

## Things explicitly ruled out along the way, and why

- CRDTs, WebSockets, service-worker sync — unnecessary complexity for a store-and-forward, periodically-online app (per your original constraints; never revisited, still holds).
- Per-user weight retraining from history — explicitly descoped by you; this removed the main original justification for keeping a large hot event log.
- Per-device _schedule_ state (separate due dates per device) — rejected early: an account should have one converged learning state, not per-device drift. Only stats are legitimately per-device.
- A standalone hot event table at any retention window — dominated by the ring buffer on cost, and by LWW-with-self-correction on necessity.

====
