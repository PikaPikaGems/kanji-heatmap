# AI Study Tools: more providers, own modal

Plan for letting learners bring keys for providers other than xAI (Grok), and
giving AI Study Tools its own modal. Based on the brainstorm mockups and the
`/spike` browser tests run from `preview-pr` on 2026-11-09.

## Decisions

- **Own modal**, with three tabs: **API keys · Tools · Usage & Saved**.
- **Where the button lives**
  - Account card: row 1 is four icons, `[App & Device Info] [User Preferences]
[FSRS Scheduler Settings] [AI Study Tools]`; row 2 is the Online/Offline
    badge.
  - Builds without accounts: the same icons at the bottom of the sidebar
    (`HeaderDrawer`).
  - Page footer (`BottomBar`) gets the AI icon too.
  - No amber "needs attention" dot for now.
- **"AI usage this month"** moves out of App & Device Info into the Usage &
  Saved tab.
- **Browser-only.** Every call goes straight from the browser to the
  provider. No proxy; a provider that blocks browser calls is left out.
- **Usage in each provider's own units** (tokens, searches, credits,
  characters). A money amount appears only when the API itself returns it, as
  xAI's `cost_in_usd_ticks` does (shown as US$, 10,000,000,000 ticks = US$1).
  No price lists, no estimates: prices change.
- **PRs target `main`.**
- **Read Aloud speaks Japanese by default** (details below).

## Providers

| Tool                                                           | Providers                       |
| -------------------------------------------------------------- | ------------------------------- |
| Anchor Word Essay, Kanji Essay, Grammar Explain, Vocab Explain | xAI, OpenAI, Anthropic, Gemini  |
| Read Aloud                                                     | xAI, ElevenLabs, OpenAI, Gemini |
| Visual Mnemonics                                               | xAI, OpenAI, Gemini             |

Left out:

- **Fish Audio**: the balance endpoint allows browser calls but
  `POST /v1/tts` does not (blocked with a JSON body, without the `model`
  header, and with a plain-text body). Revisit only if Fish Audio enables CORS
  on it.
- **ElevenLabs Image & Video**: not needed; xAI, OpenAI and Gemini cover
  images.

## What the spike showed

All from `https://preview-pr.kanji-heatmap.pages.dev`, Chrome on macOS.

| Provider   | Browser calls | Usage the app can read                                                                                                                     | Notes                                                                                                                        |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| xAI        | ✅            | tokens, `cost_in_usd_ticks`, web searches (`server_side_tool_usage_details`), rate-limit headers                                           | Already in the app. Speech 0.9 s for a 381-character essay                                                                   |
| OpenAI     | ✅            | Chat: tokens (`stream_options.include_usage`). Responses + web search: tokens and `web_search_call` count. Images: tokens. Speech: nothing | Without search it invented a Jisho link twice: don't ask for sources when search is off                                      |
| Anthropic  | ✅            | tokens, `server_tool_use.web_search_requests`, rate-limit headers                                                                          | Needs `anthropic-dangerous-direct-browser-access: true`. Search answer was the cleanest                                      |
| Gemini     | ✅            | `usageMetadata` tokens (also for speech)                                                                                                   | Free tier: 429 for search and **0** image requests. Speech is slow (17 s for 44 s of audio) and returns raw PCM (2.7 MB/min) |
| ElevenLabs | ✅            | `character-cost` header per clip; `/v1/user/subscription` for used / limit / reset date                                                    | Key needs Text to Speech, Voices: Read, User: Read                                                                           |
| Fish Audio | ❌ speech     | balance only                                                                                                                               | Out                                                                                                                          |

Web search is expensive in input: 8–19k input tokens per searched answer
versus ~25 without.

Listening (mixed English + Japanese essay): xAI `ara` natural, OpenAI `coral`
OK. ElevenLabs with a Japanese voice read kanji words as Chinese on
`eleven_multilingual_v2`, which ignores `language_code`. With
`language_code: ja`, `eleven_v3` and `eleven_flash_v2_5` read the Japanese
correctly and the English stayed clear; `eleven_v3` rated natural. `eleven_v3`
cost the same as `eleven_multilingual_v2` (84 credits for 381 characters) but
took 8.9 s against 1.3 s. Flash v2.5 cost and speed not recorded.

## The modal

### API keys tab

One card per provider (xAI, OpenAI, Anthropic, Gemini, ElevenLabs):

- password field, **Check key**, status (valid / rejected / not checked)
- "Get a key" link and the permissions the key needs (ElevenLabs: Text to
  Speech, Voices: Read, User: Read)
- which tools this key can power (text · search · images · speech)
- remove key

Keys stay per owner and per device, like the xAI key today.

### Tools tab

Six accordions, one per tool: Anchor Word Essay, Kanji Essay, Grammar
Explain, Vocab Explain, Read Aloud, Visual Mnemonics. Each holds:

- **Provider**: only providers with a valid key that can do this tool; others
  are listed as "add a key in API keys".
- **Model**: loaded from the provider's model list (not hardcoded), filtered
  to the right kind (text / image / speech), with a sensible default.
- **Options** for that tool (web search for text tools; voice and bit rate for
  Read Aloud; style, palette, quality for Visual Mnemonics).
- **Prompt** (editable, with reset), moved from today's "Prompts (advanced)":

| Tool              | Prompt ids today (`use-prompt-entries.ts`)       |
| ----------------- | ------------------------------------------------ |
| Anchor Word Essay | `vocabulary`                                     |
| Kanji Essay       | `essay`                                          |
| Grammar Explain   | `grammar`                                        |
| Vocab Explain     | `word`                                           |
| Visual Mnemonics  | `image`, `palette:*`, `style:*`                  |
| Read Aloud        | new speaking-instruction prompt (OpenAI, Gemini) |

### Usage & Saved tab

- **This month, per provider**, in its own units: requests, input/output
  tokens, web searches, images, speech characters or credits. xAI also shows
  the cost its API returns; no other provider returns one.
- **ElevenLabs balance**: credits used / limit and reset date, fetched when
  the tab opens.
- **Saved content**: today's storage bars (text, audio, images) and clear
  actions, moved from Generated content.
- **Monthly budget**: see open questions.

## Read Aloud

| Provider   | Japanese handling                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| xAI        | `language: ja` (as today)                                                                                                                                                                                                |
| ElevenLabs | `language_code: ja` on every request. Models limited to `eleven_v3` (default, most natural) and `eleven_flash_v2_5` (fast); not `eleven_multilingual_v2`, which ignores the code. Voice list shows Japanese voices first |
| OpenAI     | Instruction: the text mixes English and Japanese; read English in natural English and Japanese in standard Tokyo Japanese, never Chinese readings                                                                        |
| Gemini     | Same instruction, prefixed to the text                                                                                                                                                                                   |

- xAI and ElevenLabs (`eleven_v3`) both read mixed English + Japanese
  naturally; either can be the default.
- Gemini audio is raw 24 kHz PCM: convert to MP3 before saving, or it fills
  the 35 MB audio budget about five times faster than other providers. Show
  progress while it generates.
- OpenAI speech reports no usage: count characters ourselves.

## Text tools

- OpenAI: Chat Completions with `include_usage` when search is off; Responses
  API with the `web_search` tool when on.
- Anthropic: Messages API with the web search tool; pick the tool version the
  model supports and fall back if the API rejects it.
- Gemini: `googleSearch` tool for search. Turn the free-tier 429 into a clear
  message ("enable billing for this project in Google AI Studio").
- Prompts must not ask for sources when web search is off.
- Stream every provider, like xAI today.

## Visual Mnemonics

- xAI as today; OpenAI `gpt-image-*` via `/v1/images/generations`; Gemini with
  `responseModalities: ["IMAGE"]`.
- Remove the hardcoded US$ price estimate in `ExpandedAiSettings.tsx`.
- The OpenAI test image was 893 KB: check the requested output format is
  honoured and compress before saving if not.

## Code shape

- `src/lib/ai-explain/providers/` with one file per provider (`xai.ts` moves
  here), each exporting only what it supports: `checkKey`, `listModels`,
  `streamText({ search })`, `generateImage`, `generateSpeech`.
- Every call returns a normalised usage record
  `{ provider, inputTokens?, outputTokens?, searches?, images?, characters?, credits?, reportedCostUsd? }`.
- A small capability map (provider → text / search / image / speech) drives
  the provider pickers.
- Callers (`use-ai-explain.ts`, `use-ai-drawer-text.ts`, `AiAudio.tsx`,
  `MnemonicForm.tsx`) ask for a tool, not a provider.
- `describe-error.ts` gains provider-specific messages (ElevenLabs missing
  permission, Gemini free tier, Anthropic browser header).

## Storage and migration

- `ai-explain-keys`: `{ [ownerId]: { apiKey, keyValid } }` becomes
  `{ [ownerId]: { [provider]: { apiKey, keyValid } } }`. The old shape is read
  as the xAI key.
- `ai-explain-settings`: add per-tool `{ provider, model, options }`. Today's
  `model`, `imageModel`, `imageResolution`, `imageQuality`, `speechVoice`,
  `speechBitRate`, `speechLanguage` become the xAI entries of their tools.
  Edited prompts keep their keys.
- `ai-explain-usage`: per month, per provider. Today's totals become xAI's.

## PRs, in order

Each PR works on its own and keeps today's features working.

1. **Modal and entry points.** New modal with three tabs; icons on the account
   card, sidebar bottom and footer; move AI usage out of App & Device Info.
   xAI only.
2. **Provider layer and storage.** `providers/` folder, capability map,
   normalised usage, key and settings migration. xAI only.
3. **Text tools.** OpenAI, Anthropic, Gemini for the four text tools.
4. **Read Aloud.** ElevenLabs, OpenAI, Gemini, with the Japanese handling
   above and MP3 conversion for Gemini.
5. **Visual Mnemonics.** OpenAI, Gemini.
6. **Usage & Saved.** Per-provider usage, ElevenLabs balance.

Then delete `public/spike.html`.

## Open questions

- **ElevenLabs Japanese voices without adding them one by one.** Docs show
  `GET /v1/shared-voices?language=ja` lists Japanese Voice Library voices, and
  adding one is a separate call (`POST /v1/voices/add/{public_owner_id}/{voice_id}`,
  needs Voices: Write). Not documented: whether speech accepts a library voice
  that was never added. Being tested with the spike's "Japanese library
  voices" button.
- **Monthly budget.** Today it's one token budget. Options: a budget per
  provider in its own unit, or budgets for text providers only.

## Not doing

Proxy server, Fish Audio, ElevenLabs Image & Video, our own US$ estimates, the
amber dot.
