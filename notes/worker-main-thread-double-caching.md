# Worker / main-thread double-caching

**Status:** deferred — to be done in its own PR at a later date.

**Risk:** high. This is the one simplification from the codebase-cleanup pass
that was _not_ done, because it changes the worker protocol, turns a synchronous
main-thread API into an async one, and can't be fully verified without a real
app run (`vite build` + Playwright e2e are blocked in the cleanup environment by
the egress policy on the `kanjicanvas` dependency).

---

## What's happening

Kanji data lives in a web worker, but several of the same maps are also copied
onto the main thread, so the same data is held in two places.

### 1. Three full maps are copied worker → main thread on init

The worker owns the authoritative maps
(`src/kanji-worker/kanji-worker.ts`):

- `KANJI_INFO_MAIN_CACHE`
- `KANJI_PART_KEYWORD_MAP_CACHE`
- `KANJI_PHONETIC_MAP_CACHE`

On mount, `KanjiWorkerProvider`
(`src/kanji-worker/kanji-worker-provider.tsx`, the init `useEffect` ~lines
117–152) requests `kanji-main-map`, `part-keyword-map`, and `phonetic-map` and
copies each **full map** back onto the main thread into refs:

- `kanjiCacheRef`
- `partKeywordCacheRef`
- `phoneticCacheRef`

So after init, all three maps exist on both the worker side and the main-thread
side.

### 2. Extended kanji info is cached on both sides

- The worker loads the whole extended map via `initialize-extended-kanji-map`
  into `KANJI_INFO_EXTENDED_CACHE`.
- The main thread _also_ lazily fills `kanjiInfo.extended` per-kanji as each
  kanji is requested
  (`kanji-worker-provider.tsx`, in `kanjiInfoRequest`, ~line 224:
  `kanjiCacheRef.current[kanji].extended = res;`).

---

## Why it exists

The main thread needs **synchronous** access to this data for two things:

1. **`getKanjiBasicInfo`** (`kanji-worker-provider.tsx` ~lines 236–244) — a
   synchronous lookup exposed through `GetBasicKanjiInfoContext`. Consumed by
   `useGetKanjiInfoFn` → `useWordKanjis`
   (`src/kanji-worker/kanji-worker-hooks.tsx`) and hover-keyword lookups. These
   run **during render**, so they can't be async as written.

2. **`extractKanjiHoverData`** (`kanji-worker-provider.tsx` ~lines 27–99) —
   hover-card assembly runs on the main thread and reads all three copied maps
   synchronously (`kanjiCache`, `partKeywordCache`, `phoneticCache`).

Shipping the maps over once at init is what lets both of those stay synchronous.

---

## What removing it would take

To eliminate the main-thread copies, the synchronous consumers have to go away
or move:

- Move **hover-card assembly** (`extractKanjiHoverData`) into the worker, so the
  main thread just requests a fully-assembled hover payload instead of holding
  the maps to build it locally.
- Make **`getKanjiBasicInfo` async**, which ripples into every synchronous
  `getKanjiInfo(...)` call site during render — most notably `useWordKanjis`,
  which would need to become a worker-backed async hook (it can reuse the
  existing `useWorkerQuery` primitive in `kanji-worker-hooks.tsx`).

That's a genuine protocol + API change, not a local refactor — hence its own PR.

---

## Recommended approach when we pick this up

1. **Measure first.** Confirm the duplicate maps are actually a memory concern
   worth the churn before changing anything. If the maps are small in practice,
   this may not be worth doing at all.
2. **Do it where the full build runs.** Land it on a branch/environment where
   `vite build` and Playwright e2e can actually execute, so the regression
   surface (hover cards, word-part keywords, kanji detail page) is exercised
   end-to-end.
3. **Scope it tightly.** Move only hover-card assembly into the worker first. If
   `getKanjiBasicInfo` can be left synchronous by keeping just the small
   basic-info/keyword maps on the main thread (and dropping only the extended +
   hover duplication), prefer that smaller step over converting everything to
   async.

## Key files

- `src/kanji-worker/kanji-worker-provider.tsx` — main-thread caches, init copy,
  `kanjiInfoRequest`, `getKanjiBasicInfo`, `extractKanjiHoverData`.
- `src/kanji-worker/kanji-worker.ts` — authoritative worker-side caches and
  request handlers.
- `src/kanji-worker/kanji-worker-hooks.tsx` — `useGetKanjiInfoFn`,
  `useWordKanjis`, and the `useWorkerQuery` primitive an async
  `getKanjiBasicInfo` would build on.
