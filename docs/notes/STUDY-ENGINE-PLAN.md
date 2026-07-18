# Study Engine Plan

## Decision

We will use three separate parts:

1. **Kanji Heatmap** — the public GPLv3 React application.
2. **`kh-study-engine`** — a separate public, GPL-compatible repository.
3. **Backend** — a private service owned by PikaPikaGems.

Kanji Heatmap will use a no-op study engine by default. It will not download
or install `kh-study-engine` during a normal `pnpm install`.

## Goals

- Keep Kanji Heatmap easy to build and contribute to.
- Let developers use their own study engine.
- Keep the React application independent of any engine implementation.
- Support offline FSRS reviews.
- Put authentication, cloud sync, and premium access control behind the
  private backend.
- Keep the setup simple and explicit.

## Repository responsibilities

### Kanji Heatmap

Kanji Heatmap owns:

- React screens and components
- The public `StudyEngine` TypeScript interface
- The built-in no-op implementation
- The React provider and hooks
- Recognition and production quiz presentation
- Vite integration for selecting an engine

Application components will not import `kh-study-engine` directly.

### `kh-study-engine`

The official engine owns:

- `ts-fsrs` integration
- Dexie and IndexedDB storage
- Creating and deleting cards
- Finding due cards
- Rating cards
- Card statistics and review history
- FSRS settings
- Offline operation queue
- Authentication API client
- Cloud sync client

It should be framework-independent. It must not depend on React, Wouter,
Tailwind, or Kanji Heatmap components.

### Private backend

The backend owns:

- Sending and verifying email PINs
- Session creation and revocation
- Premium entitlement checks
- Cloud data storage
- Sync processing and conflict handling
- Billing, rate limits, secrets, and abuse prevention

The browser never stores backend secrets or long-lived session tokens.

## Engine contract

Kanji Heatmap will define a small, versioned interface:

```ts
export interface StudyEngineModule {
  apiVersion: 1;
  createStudyEngine(): StudyEngine;
}

export interface StudyEngine {
  available: boolean;
  auth: AuthService;
  cards: CardService;
  reviews: ReviewService;
  settings: SettingsService;
  sync: SyncService;
}
```

The official engine, custom engines, and no-op engine must implement the same
interface.

The no-op engine reports `available: false`. Its methods return an explicit
`unavailable` result. They must not pretend that writes succeeded.

## Selecting an engine

Application code imports one virtual module:

```ts
import { createStudyEngine } from "virtual:study-engine";
```

Vite resolves that module using this environment variable:

```env
KH_STUDY_ENGINE_ENTRY=/absolute/or/relative/path/to/dist/index.js
```

Selection rules:

- Variable not set: use the no-op engine.
- Configured file exists: use that engine.
- Configured file is missing or invalid: print a clear warning and use the
  no-op engine.
- Unsupported engine API version: print a clear warning and use the no-op
  engine.

Engine selection happens only in the build configuration. React components
do not contain engine-selection conditionals.

## Normal contributor flow

```bash
pnpm install
pnpm dev
```

This uses the no-op engine. It does not download another repository and does
not require a backend.

Premium routes and account controls remain hidden when the engine reports
`available: false`.

## Custom local engine flow

Developers can build any compatible engine locally:

```bash
cd ../my-study-engine
pnpm install
pnpm build
```

They then point Kanji Heatmap to its entry file:

```bash
KH_STUDY_ENGINE_ENTRY=../my-study-engine/dist/index.js pnpm dev
```

They do not need the PikaPikaGems production build or official engine.

The README will document the interface and local setup. The official engine
is one implementation, not a required default.

## PikaPikaGems production flow

Cloudflare Pages will run:

```bash
pnpm build:production
```

Production configuration will provide:

```env
KH_STUDY_ENGINE_VERSION=v1.2.0
KH_STUDY_ENGINE_COMMIT=immutable-commit-sha
KH_STUDY_ENGINE_SHA256=expected-archive-checksum
```

The production build script will:

1. Download the pinned `kh-study-engine` GitHub release.
2. Verify its commit and SHA-256 checksum.
3. Extract it under `.vendor/kh-study-engine`.
4. Install its locked dependencies.
5. Build the engine.
6. Build Kanji Heatmap with `KH_STUDY_ENGINE_ENTRY` pointing to the generated
   engine entry file.

The engine is bundled into normal Vite assets. It is not downloaded when a
visitor opens the website, and it remains available to the PWA offline.

If engine preparation fails, the build warns and uses the no-op engine.
Deployment monitoring should alert when production reports
`available: false`.

The build should record the selected engine version and commit in deployment
metadata.

## FSRS card model

Recognition and production should use separate cards because they test
different memories:

```ts
type CardDirection = "recognition" | "production";
```

The engine API will support:

```ts
engine.cards.create(input);
engine.cards.delete(cardId);
engine.cards.getDue({ direction, limit });
engine.cards.getStatistics(cardId);
engine.reviews.rate(cardId, rating);
```

The engine will expose Kanji Heatmap-owned data types instead of exposing
`ts-fsrs` types directly. This lets us upgrade or replace `ts-fsrs` later.

## Review flow

The new FSRS screen will reuse presentation and answer-checking behavior from
`RecognitionPracticeV1` and `ProductionPracticeV1`.

It will not reuse their deck selection. The engine decides which due card is
shown next.

Review behavior:

- Incorrect answer: record FSRS `Again`.
- Correct answer: show `Hard`, `Normal`, and `Easy`.
- `Normal` maps to FSRS `Good`.

A rating is saved in one Dexie transaction:

1. Read the current card.
2. Apply the FSRS calculation.
3. Update the card and next due date.
4. Append an immutable review event.
5. Add a sync operation to the offline outbox.

## Local database and sync

Dexie will contain tables for:

- Cards and current FSRS state
- Immutable review events
- FSRS settings
- Pending sync operations
- Sync cursor and metadata
- Cached non-secret account details

Reviews work without a network connection. When connectivity returns, the
sync client sends pending operations and the last server cursor.

The server must treat operations as idempotent. Deletions use tombstones so
they can reach other devices.

## Authentication

The public engine only contains the API client:

```text
POST /api/auth/pin/request
POST /api/auth/pin/verify
POST /api/auth/logout
GET  /api/auth/session
POST /api/sync
```

`kanjiheatmap.com/api` proxies requests to the private backend. Browser
sessions use secure, HttpOnly cookies.

The private backend checks premium entitlement on every protected request.
Changing the public frontend cannot grant access to cloud data.

## Settings screen

The first settings screen should include:

- Desired retention
- Maximum interval
- New cards per day
- Maximum reviews per day
- Learning steps
- Relearning steps
- Recognition and production preferences

Settings are validated, versioned, stored locally, and synchronized.

## Licensing

- Kanji Heatmap remains GPLv3.
- `kh-study-engine` is public and GPL-compatible.
- `ts-fsrs` is MIT licensed.
- Dexie is Apache-2.0 licensed.
- Required dependency notices must be retained.
- The private backend remains separate and proprietary.

No Kanji Heatmap relicensing is planned.

Local FSRS behavior cannot be securely paywalled because it runs in public
browser code. Authentication, cloud sync, backups, and multi-device support
remain enforceable premium services through the private backend.

Developers may create other compatible engines. Anyone distributing an
engine together with Kanji Heatmap must follow the applicable GPL terms.

## Implementation order

1. Define and document the versioned engine contract.
2. Add the no-op implementation and React provider.
3. Add Vite virtual-module selection.
4. Create the public `kh-study-engine` repository.
5. Implement Dexie storage and migrations.
6. Implement card operations and `ts-fsrs`.
7. Add engine unit tests.
8. Add the FSRS recognition flow.
9. Add the FSRS production flow.
10. Add the settings and statistics screens.
11. Add the authentication client.
12. Add offline sync and backend endpoints.
13. Add the pinned production download and build script.
14. Add production monitoring for accidental no-op deployments.

## Product decisions still needed

- Does adding one word create recognition and production cards, or does the
  user choose?
- Should local account data be removed on logout?
- How long can a previously authenticated user use premium features offline?
- Are FSRS settings shared between recognition and production?
- How should existing local practice history be migrated?
