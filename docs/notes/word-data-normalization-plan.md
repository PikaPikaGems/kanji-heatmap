# Plan: normalize word data (readings, glosses, tags) across the v2 JSON files

## Problem

The same word's data is stored in several `public/json/v2/` files, in different formats:

- **Glosses disagree.** 2,102 words are both anchor words (`anchor_words_details.json`) and
  reference card sample words (`vocab.json`). Only 278 have the same gloss.
  - 意見: anchor `1. opinion; view; comment 2. scolding; …`, card `opinion, view, comment`.
- **Popovers differ.**
  - The reference card builds its own popover (`KanjiInfoCard/WordCard.tsx`).
  - Every other word uses `ExampleWordPopover`.
  - The card shows 3 tags before "…", the others show 2.
- **Fields are grouped by screen, not by what they are.**
  - The main anchor word and its reading are in `kanji_main.json`, its gloss is in
    `anchor_words_details.json`, its tags and ranks are in `word_frequency_tags.json`.
  - Sample words are in `kanji_extended_hover.json` next to the kanji's parts, and their
    furigana and gloss are in `vocab.json`.
- **A copied field:** `components.json`'s `n` (stroke count) is a copy of `radicals.json`'s
  `groupedByStrokeCount`. For the 151 components that are kanji, it also equals
  `kanji_main.json`'s stroke count.

## How it got this way

1. **The old kanji-heatmap-data release** (`raw-data/kanji-heatmap-data/`) shipped
   `vocab_furigana.json` and `vocab_meaning.json` (short, comma-joined glosses) for the
   reference card words.
2. **Anchor words** (jp-misc-data `e97de4b`) were split by when they're needed:
   - The word and readings went into eager `kanji_main.json`, because tiles show them.
   - The gloss and secondary word went into lazy `anchor_words_details.json`.
   - Tags, ranks and tier went into `word_frequency_tags.json`.
   - Glosses come from JMdict `get_english_glosses` (numbered).
3. **New sample words** (jp-misc-data `6dedb86`): `sample_words.py` kept the old release's
   furigana and meaning where it had them. For 1,658 new words it wrote a third format
   (first sense only, comma-joined).

No step had one record per word, so each stored its own copy.

## Decisions

### New `public/json/v2/` files

| File                 | Key → value                                                                                 | Loaded                                                              |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `kanji_main.json`    | kanji → the 11 sort/filter fields (anchor word and reading **removed**)                     | eager, first paint                                                  |
| `kanji_words.json`   | kanji → `[mainAnchor, secondaryAnchor \| "", sample1Furigana \| "", sample2Furigana \| ""]` | requested right after `kanji_main.json`; does not block first paint |
| `kanji_parts.json`   | kanji → `[parts, phonetic]` (the rest of `kanji_extended_hover.json`)                       | reference card, Character Structure                                 |
| `word_readings.json` | word → `"reading・reading"` (one string, no furigana)                                       | lazy                                                                |
| `word_meanings.json` | word → gloss (one format: JMdict `get_english_glosses`)                                     | lazy                                                                |
| `word_tags.json`     | word → `[tags, tierEmoji]`                                                                  | lazy, when tags are shown                                           |
| `word_ranks.json`    | anchor word → 17 ranks                                                                      | anchor panel's frequency table only                                 |

- **Keys:** `kanji_*` files are keyed by kanji, `word_*` files by word. `kanji_words.json` is
  what links a kanji to its words.
- **Words covered:** every anchor word and every sample word (6,550 today).
  - `word_readings.json` and `word_meanings.json` have that full key set.
  - `word_tags.json` skips words with no tags and no tier.
  - `word_ranks.json` has anchor words only.
- **Furigana only for sample words,** and only in `kanji_words.json`.
  - Example: `二: ["二", "二つ", "二[ふた]人[り]", "二[ふつ]日[か]"]`.
  - A sample word's plain form is its furigana with the brackets removed.
  - The furigana is for the reference card, which highlights the kanji's own part.
- **Tier stays as the emoji** (🌱 ☘️ 🌷 📚 🌶️ 🦉). One ASCII letter would save only 0.5 KB gzip,
  and the emoji is already the app's tier code (`ANCHOR_TIER_LABELS`) and the
  `kanji-common-words` pages' `t`.
- **Removed:**
  - `vocab.json`
  - `anchor_words_details.json`
  - `word_frequency_tags.json`
  - `kanji_extended_hover.json`
  - the `n` field in `components.json`
- **Not combined:** `word_readings` + `word_meanings`, and `kanji_words` + `kanji_parts`.
  Tiles need only one half of each pair:
  - Combining readings and meanings would make tiles wait for 203 KB gzip instead of 53 KB.
  - Combining words and parts would make tiles wait for 76 KB gzip instead of 61 KB.

### Sizes (from today's data, gzip)

| File                 | Before | After   |
| -------------------- | ------ | ------- |
| `kanji_main.json`    | 177 KB | ~157 KB |
| `kanji_words.json`   | –      | ~61 KB  |
| `kanji_parts.json`   | –      | ~19 KB  |
| `word_readings.json` | –      | ~53 KB  |
| `word_meanings.json` | –      | ~169 KB |
| `word_tags.json`     | –      | ~57 KB  |

### Popovers

- **One popover:** the reference card uses `ExampleWordPopover`, with a prop for its trigger
  (kana above the word, with the kanji's part highlighted). `WordCard` no longer builds its own
  `GenericPopover`.
- **Tags:** every popover gets tags from `word_tags.json` and shows **2** before "…".
- **Furigana:**
  - The reference card shows it, read from its kanji's sample slots in `kanji_words.json`.
  - Every other popover button shows the plain word. There's no word → furigana index.
- **Reading and meaning:** when no override is passed (e.g. Reading Usefulness), the popover
  reads `word_readings.json` and `word_meanings.json`. A word not in the set shows no meaning,
  as today.

### Loading states

| Place                                                     | While `kanji_words.json` loads                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Expanded tile anchor line (`ExpandedBtnContent.tsx`)      | Shows `·` (as today), then fades in the word and reading (`animate-fade-in-fast`)                           |
| Mastery screen tiles (`MasteryScreen.tsx`)                | `LoadingKanjis` tile skeleton until the worker **and** `kanji_words.json` are ready, so tiles never recolor |
| Dashboard Kanji Mastery (`KanjiMasteryBody.tsx`)          | Kaomoji, as today (it already waits on `getAnchorWords`)                                                    |
| "Anchor words only" filter (`use-client-list-filters.ts`) | `isLoading` becomes `getAnchorWords == null`, so the list shows `LoadingKanjis`                             |
| Practice decks, review lookup                             | Unchanged: they already wait on `useGetAnchorWordsFn`                                                       |

### Left as is

- **`kanji_reading_details.json`** (Reading Usefulness).
  - It's copied unchanged from Kandrac's _Jōyō Kanji Readings_.
  - Its example words (`w`) show a meaning only when the word is in the word set. 976 of the
    4,026 aren't.
  - Its readings are a different set and format from `allOn`/`allKun`.
- **Radical popover sound examples:** the 55 `{ word, reading, gloss }` in
  `radical_popover_text.json` keep their own reading and short hand-written gloss. They're small
  and only load with the radical popover.
- **Cloudflare per-kanji pages** (`kanji-textbook-words`, `kanji-common-words`). They're
  self-contained on purpose and already use `get_english_glosses`. Their tier-encoding
  inconsistency is tracked in jp-misc-data #75.
- **Not redundant, checked:**
  - main on/kun vs `allOn[0]`/`allKun[0]` (the eager tiles need them);
  - the three structure sources (`kanji_parts`, `kanji_decomposition`, `kanji_structures`);
  - `similar_kanjis.json` (ranked, not symmetric);
  - keyword vs `meanings[0]`.
- **Not touched:** Fill the Kanji, and mastery progress keys (by kanji and main/secondary, not
  by file).

## Step 1: data build (jp-misc-data)

1. **One gloss function for every word.**
   - `anchor-words/to_app_json.py` and `anchor-words/sample_words.py` both use the word data's
     `english_gloss`, which comes from `get_english_glosses`.
   - Drop `sample_words.py`'s `meaning()` and its use of the old `vocab_meaning.json`.
   - The old meaning stays only as a last resort for a word with no JMdict entry, and the build
     reports how many words use it.
   - For a word with more than one reading where the builds disagree (館, 白熊), the gloss
     follows the reading the app shows (the anchor word's reading).
2. **Raw outputs** (`kanji-heatmap-build-2/raw-data/anchor-words/`, `sample-words/`): write
   one record per word, with readings, gloss, tags, tier and ranks, plus the per-kanji word
   lists. Update `raw-data/README.md`.
3. **`generate-v2-json.mjs`** writes the seven files above:
   - Remove slots 12–13 from `kanji_main.json` and update its slot check (13 → 11).
   - Stop writing `n` into `components.json`.
   - Add checks:
     - every word in `kanji_words.json` has a `word_readings.json` and a
       `word_meanings.json` entry;
     - every anchor word has a `word_ranks.json` entry;
     - each sample furigana, with brackets removed, is its word;
     - no word has two glosses.
4. **`copy-to-kanji-heatmap.mjs`**: copies the new files and deletes the four removed ones.
5. **Tests:** `tests/v2-data.test.ts` checks the old files, so it will fail. Changing it needs
   your OK (repo rule); I'll list the exact changes for approval first.

## Step 2: app (kanji-heatmap)

1. **Paths and types:** in `src/lib/assets-paths.ts` and `src/lib/kanji/kanji-worker-types.ts`,
   add the seven files and drop the four old ones. Remove `n` from the components type.
2. **Worker** (`src/kanji-worker/`):
   - `transformToMainKanjiInfo` drops `repWord` and `repReading`.
   - New lazy datasets: `kanji_words`, `kanji_parts`, `word_readings`, `word_meanings`,
     `word_tags`, `word_ranks`.
   - `kanji_words` is requested as soon as `kanji_main` resolves, before the rest of `preload`.
   - `handleKanjiHover` reads `kanji_words`, `kanji_parts`, `word_readings` and
     `word_meanings`.
   - `handleKanjiAnchorWords` and `"anchor-words-details"` read `kanji_words`,
     `word_readings` and `word_meanings`. Ranks come from `word_ranks`.
   - `handleWordTags` reads `word_tags`.
   - `handleRetrieveVocabInfo` returns `{ reading, meaning }` from `word_readings` and
     `word_meanings` (no furigana parts).
   - `handleSphmnDrawer` takes stroke counts from `kanji_main`, or else `radicals.json`'s
     `groupedByStrokeCount`, instead of `components[component].n`.
3. **Anchor-word checks move to `useGetAnchorWordsFn`.** These files read `repWord` from
   `kanji_main.json` today and switch to `getAnchorWords(kanji)?.main`:
   - `use-client-list-filters.ts`
   - `mastery-tally.ts`
   - `MasteryTileColors.tsx` (hook on for every mastery metric)
   - `use-suggested-kanji.ts`
   - `kanji-representative-word-hooks.tsx` (`useKanjiRepresentativeWord`)
4. **Loading states:** as in the table above.
5. **Popovers:**
   - `WordCard.tsx` uses `ExampleWordPopover` with the card's trigger, and passes its furigana.
   - `ExampleWordPopover`'s button shows the plain word unless furigana is passed in.
   - `WordFrequencyTags.tsx` uses `maxVisible={2}`.
   - `WordRow.tsx` tags come from `word_tags.json` through the same component.
   - `StudyNoteVocabButton.tsx` gets its kana from `word_readings.json` instead of furigana
     parts.
6. **Tests:** several existing tests use the old shapes and will fail:
   - `kanji-assembly.test.ts` and its snapshot
   - `kanji-worker.test.ts`
   - `kanji-search.test.ts`
   - `build-deck.test.ts`
   - `kanji-representative-word-hooks.test.tsx`

   Changing them needs your OK (repo rule), so I'll list the exact changes first.

7. **Checks:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `CF_PAGES=1 pnpm build`,
   `pnpm exec prettier --check .`. Then a browser check of:
   - tiles
   - the reference card (glosses get longer: numbered JMdict senses)
   - the anchor panel
   - popovers
   - mastery
   - the filter

## Order and PRs

1. **jp-misc-data PR:** Step 1. kanji-heatmap `main` keeps the old files until step 2 lands.
2. **kanji-heatmap PR:** Step 2, with the regenerated `public/json/v2/` from step 1. The data
   and the code ship together, so no deploy has a mismatch.

## Not in scope

- Which words are picked as sample or anchor words. 1,753 sample slots repeat the kanji's own
  anchor word; that's a sample-picking question.
- Furigana for words that aren't sample words, and furigana on popover buttons outside the
  reference card.
- The textbook pages' tier encoding (jp-misc-data #75).
