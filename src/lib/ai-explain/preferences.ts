import {
  IMAGE_PALETTE_LABELS,
  IMAGE_STYLE_LABELS,
  type ImagePalette,
  type ImageStyle,
} from "./prompts";
import { notifyStorage, safeReadJson } from "@/lib/storage";
import {
  getCurrentOwner,
  GUEST_OWNER_ID,
  type ContentOwner,
} from "@/lib/engine/content-owner";
import {
  AI_PROVIDER_ORDER,
  AI_TOOL_ORDER,
  AI_TOOLS,
  type AiTool,
} from "./providers/capabilities";
import type { AiProvider, AiUsageRecord } from "./providers/types";

export const AI_EXPLAIN_SETTINGS_KEY = "ai-explain-settings";
/**
 * The API keys per owner and provider:
 * `{ [ownerId]: { [provider]: { apiKey, keyValid } } }`. Before more
 * providers, it held one xAI key per owner: `{ [ownerId]: { apiKey, keyValid } }`.
 */
export const AI_EXPLAIN_KEYS_KEY = "ai-explain-keys";
export const AI_EXPLAIN_USAGE_KEY = "ai-explain-usage";
/**
 * MP3 bit rates offered (192 kbps left out: no gain for speech). xAI takes
 * any; ElevenLabs gets the nearest it offers.
 */
export const AI_SPEECH_BIT_RATES = [32000, 64000, 96000, 128000] as const;
export type AiSpeechBitRate = (typeof AI_SPEECH_BIT_RATES)[number];
export const DEFAULT_AI_SPEECH_BIT_RATE: AiSpeechBitRate = 64000;

/** Replaced with the sentence (furigana stripped) before sending. */
export const JAPANESE_TEXT_PLACEHOLDER = "{JAPANESE_TEXT}";

export const DEFAULT_AI_EXPLAIN_PROMPT = `You are a Japanese tutor helping an English-speaking learner.
Explain the Japanese text below. No greeting, preamble or closing remarks.

Japanese text: ${JAPANESE_TEXT_PLACEHOLDER}

Reply in Markdown, in exactly this format (keep the blank lines):

**Vocabulary**
1. <word in dictionary form> · <reading in kana> · <short English gloss>
2. ...

**Literal:** <literal translation>

**Natural:** <natural translation>

**Grammar**
- **<pattern>** (<JLPT level>): <what it does here and its nuance>

Rules:
- Vocabulary: one line per content word, in the order they appear. Skip particles and the copula. Give conjugated verbs and adjectives in dictionary form. For a word written only in kana, leave out the reading.
- Literal: a real, grammatical English sentence that follows the Japanese structure and word choices closely, so it sounds a little stiff or awkward. Never just list the word glosses in Japanese order.
- Natural: how a native English speaker would actually say it.
- Example of the difference, for 雨が降りそうだから、傘を持っていったほうがいいよ。
  Literal: Because it looks like rain will fall, it is better to take an umbrella and go, you know.
  Natural: It looks like rain, so you'd better take an umbrella.
- Grammar: 3 to 5 patterns at JLPT N4 level or above only, each one short sentence under 15 words. Never explain N5 basics: particles (は, が, を, に, で, へ, と, も, の, か, よ, ね), です, だ, ます forms, plain past or negative forms, この/その/あの. If the text has fewer than 3 N4+ patterns, list only those; if it has none, write "No N4+ grammar here."`;

/**
 * How OpenAI and Gemini are asked to speak. Essays mix English and Japanese;
 * without this, kanji words can come out with Chinese readings.
 */
export const DEFAULT_AI_SPEECH_PROMPT =
  "Read this aloud calmly and a little slowly, like a language teacher. The text mixes English and Japanese: read the English parts in natural English and the Japanese parts in natural, standard Tokyo Japanese. Never use Chinese readings for kanji.";

/** AI Explain for a single word (e.g. the emoji set): no grammar section. */
export const DEFAULT_AI_EXPLAIN_WORD_PROMPT = `You are a Japanese tutor helping an English-speaking learner.
Explain the Japanese word below. No greeting, preamble or closing remarks.

Japanese word: ${JAPANESE_TEXT_PLACEHOLDER}

Reply in Markdown, in exactly this format (keep the blank lines):

**Word:** <word in dictionary form> · <reading in kana> · <short English gloss>

**Kanji**
- <kanji> · <its meaning in this word> · <the reading it takes here>

**Usage:** <one or two sentences on when and how the word is used, and its nuance>

**Examples**
1. <short natural Japanese sentence> · <English translation>
2. ...

Rules:
- Kanji: one line per kanji in the word, in order. Leave the section out for a word written only in kana.
- Usage: mention politeness, register or easily confused words only when they matter.
- Examples: 2 short everyday sentences around JLPT N4 level, each under 15 words.
- This is a single word, not a sentence: no grammar section and no literal translation.`;

/** One provider's key of one owner (a logged-in account, or the guest). */
export type AiOwnerKey = {
  apiKey: string;
  /** True once the provider accepted `apiKey`; reset whenever it changes. */
  keyValid: boolean;
};

export type AiOwnerKeys = Record<AiProvider, AiOwnerKey>;

/**
 * What one tool uses. `model` and `voice` belong to `provider`: picking
 * another provider clears them.
 */
export type AiToolChoice = {
  /** Unset: the first provider in the tool's list with a key that works. */
  provider?: AiProvider;
  /** Unset: the provider's default model. */
  model?: string;
  /** Kanji Essay and Anchor Word Essay; unset means on. */
  webSearch?: boolean;
  /** Read Aloud. */
  voice?: string;
  /** The voice's name, for voices listed online (ElevenLabs). */
  voiceName?: string;
  bitRate?: AiSpeechBitRate;
  /** Read Aloud on xAI; unset means Japanese. */
  language?: "auto" | "ja";
  /** Visual Mnemonics on xAI. */
  resolution?: "1k" | "2k";
  /** Visual Mnemonics on xAI and OpenAI. */
  quality?: "low" | "medium";
  /** Visual Mnemonics: picked for new images; unset means Kanji Heatmap. */
  style?: ImageStyle;
  palette?: ImagePalette;
};

/**
 * Preferences shared by everyone using this browser. Unset prompts mean the
 * defaults, so improving a default reaches everyone who never edited it. The
 * API keys are not here: they belong to one owner (see below).
 */
export type AiExplainPreferences = {
  enabled: boolean;
  tools: Partial<Record<AiTool, AiToolChoice>>;
  /** Grammar Explain's prompt. */
  prompt?: string;
  /** Vocab Explain's prompt (a single word). */
  wordPrompt?: string;
  vocabularyPrompt?: string;
  kanjiEssayPrompt?: string;
  imagePrompt?: string;
  imageStylePrompts?: Partial<Record<ImageStyle, string>>;
  /** The Kanji Heatmap palette prompt (kept under its original key). */
  imagePalettePrompt?: string;
  /** Edited prompts for the other palettes, including Custom. */
  imagePalettePrompts?: Partial<Record<ImagePalette, string>>;
  /** Read Aloud's speaking instructions (OpenAI, Gemini). */
  speechPrompt?: string;
};

/** What AI features read: the shared preferences plus the owner's keys. */
export type AiExplainSettings = AiExplainPreferences & { keys: AiOwnerKeys };

const optionalString = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v : undefined;

const readPromptRecord = <K extends string>(
  value: unknown,
  keys: K[]
): Partial<Record<K, string>> => {
  if (!value || typeof value !== "object") return {};
  const result: Partial<Record<K, string>> = {};
  for (const key of keys) {
    const prompt = optionalString((value as Record<string, unknown>)[key]);
    if (prompt) result[key] = prompt;
  }
  return result;
};

const isProvider = (value: unknown): value is AiProvider =>
  AI_PROVIDER_ORDER.includes(value as AiProvider);

/** One tool's saved choice, dropping anything malformed. */
const readToolChoice = (value: unknown): AiToolChoice => {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const choice: AiToolChoice = {};
  if (isProvider(raw.provider)) choice.provider = raw.provider;
  const model = optionalString(raw.model);
  if (model) choice.model = model.trim();
  if (raw.webSearch === false) choice.webSearch = false;
  const voice = optionalString(raw.voice);
  if (voice) choice.voice = voice;
  const voiceName = optionalString(raw.voiceName);
  if (voice && voiceName) choice.voiceName = voiceName;
  const bitRate = AI_SPEECH_BIT_RATES.find((rate) => rate === raw.bitRate);
  if (bitRate) choice.bitRate = bitRate;
  if (raw.language === "auto") choice.language = "auto";
  if (raw.resolution === "2k") choice.resolution = "2k";
  if (raw.quality === "medium") choice.quality = "medium";
  if (typeof raw.style === "string" && raw.style in IMAGE_STYLE_LABELS)
    choice.style = raw.style as ImageStyle;
  if (typeof raw.palette === "string" && raw.palette in IMAGE_PALETTE_LABELS)
    choice.palette = raw.palette as ImagePalette;
  return choice;
};

const readToolChoices = (value: unknown): AiExplainPreferences["tools"] => {
  if (!value || typeof value !== "object") return {};
  const tools: AiExplainPreferences["tools"] = {};
  for (const tool of Object.keys(AI_TOOLS) as AiTool[]) {
    const choice = readToolChoice((value as Record<string, unknown>)[tool]);
    if (Object.keys(choice).length > 0) tools[tool] = choice;
  }
  return tools;
};

/** Reads the shared preferences, dropping anything malformed. */
export const readAiExplainPreferences = (): AiExplainPreferences => {
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_EXPLAIN_SETTINGS_KEY,
    null
  );
  if (!raw || typeof raw !== "object") return { enabled: false, tools: {} };
  return {
    enabled: raw.enabled === true,
    tools: readToolChoices(raw.tools),
    prompt: optionalString(raw.prompt),
    wordPrompt: optionalString(raw.wordPrompt),
    vocabularyPrompt: optionalString(raw.vocabularyPrompt),
    kanjiEssayPrompt: optionalString(raw.kanjiEssayPrompt),
    imagePrompt: optionalString(raw.imagePrompt),
    imagePalettePrompt: optionalString(raw.imagePalettePrompt),
    speechPrompt: optionalString(raw.speechPrompt),
    imageStylePrompts: readPromptRecord(
      raw.imageStylePrompts,
      Object.keys(IMAGE_STYLE_LABELS) as ImageStyle[]
    ),
    imagePalettePrompts: readPromptRecord(
      raw.imagePalettePrompts,
      Object.keys(IMAGE_PALETTE_LABELS) as ImagePalette[]
    ),
  };
};

export const writeAiExplainPreferences = (
  preferences: AiExplainPreferences
) => {
  try {
    localStorage.setItem(AI_EXPLAIN_SETTINGS_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can throw (e.g. private mode); the preferences just aren't saved.
  }
  notifyStorage(AI_EXPLAIN_SETTINGS_KEY);
};

/**
 * Changes one tool's choice. Picking another provider clears the model and
 * voice, which belonged to the previous one.
 */
export const updateAiToolChoice = (tool: AiTool, patch: AiToolChoice) => {
  const preferences = readAiExplainPreferences();
  const current = preferences.tools[tool] ?? {};
  const switching = "provider" in patch && patch.provider !== current.provider;
  const next: AiToolChoice = {
    ...current,
    ...(switching
      ? { model: undefined, voice: undefined, voiceName: undefined }
      : {}),
    ...patch,
  };
  writeAiExplainPreferences({
    ...preferences,
    tools: { ...preferences.tools, [tool]: next },
  });
};

/** Fields the xAI-only settings had, before choices were per tool. */
const LEGACY_FIELDS = [
  "model",
  "imageModel",
  "imageResolution",
  "imageQuality",
  "speechVoice",
  "speechBitRate",
  "speechLanguage",
  "noWebSearch",
  "monthlyTokenBudget",
];

/**
 * Before choices were per tool, one xAI model served every text tool and the
 * image and speech options sat at the top level. They become the xAI choices
 * of their tools. The monthly token budget is dropped, and so is the speech
 * language: "auto" was saved for everyone, and Read Aloud now speaks
 * Japanese unless switched. Module-level: runs once when this file loads.
 */
const moveLegacyChoicesToTools = () => {
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_EXPLAIN_SETTINGS_KEY,
    null
  );
  if (!raw || typeof raw !== "object") return;
  if (!LEGACY_FIELDS.some((field) => field in raw)) return;
  const tools = readToolChoices(raw.tools);
  const merge = (tool: AiTool, choice: AiToolChoice) => {
    if (raw.tools !== undefined) return;
    if (Object.keys(choice).length === 0) return;
    tools[tool] = { ...tools[tool], ...choice };
  };
  const model = optionalString(raw.model);
  for (const tool of ["anchorWord", "kanjiEssay", "grammar", "vocab"] as const)
    if (model) merge(tool, { provider: "xai", model });
  if (raw.noWebSearch === true) {
    merge("anchorWord", { webSearch: false });
    merge("kanjiEssay", { webSearch: false });
  }
  const imageModel = optionalString(raw.imageModel);
  merge("mnemonics", {
    ...(imageModel ? { provider: "xai", model: imageModel } : {}),
    ...(raw.imageResolution === "2k" ? { resolution: "2k" } : {}),
    ...(raw.imageQuality === "medium" ? { quality: "medium" } : {}),
  });
  const voice = optionalString(raw.speechVoice);
  const bitRate = AI_SPEECH_BIT_RATES.find(
    (rate) => rate === raw.speechBitRate && rate !== DEFAULT_AI_SPEECH_BIT_RATE
  );
  merge("readAloud", {
    ...(voice ? { provider: "xai", voice } : {}),
    ...(bitRate ? { bitRate } : {}),
  });
  const rest: Record<string, unknown> = { ...raw, tools };
  for (const field of LEGACY_FIELDS) delete rest[field];
  try {
    localStorage.setItem(AI_EXPLAIN_SETTINGS_KEY, JSON.stringify(rest));
  } catch {
    // Storage can throw (e.g. private mode); this runs again next load.
  }
};

const NO_KEY: AiOwnerKey = { apiKey: "", keyValid: false };

const readKey = (value: unknown): AiOwnerKey | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const { apiKey, keyValid } = value as Record<string, unknown>;
  if (typeof apiKey !== "string" || apiKey === "") return undefined;
  return { apiKey, keyValid: keyValid === true };
};

type StoredOwnerKeys = Partial<Record<AiProvider, AiOwnerKey>>;

/**
 * Owners with a saved key, per provider; anything malformed is dropped. An
 * owner saved before there were providers holds one key: xAI's.
 */
const readAllKeys = (): Map<string, StoredOwnerKeys> => {
  const raw = safeReadJson<unknown>(AI_EXPLAIN_KEYS_KEY, null);
  const keys = new Map<string, StoredOwnerKeys>();
  if (!raw || typeof raw !== "object") return keys;
  for (const [ownerId, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object") continue;
    const legacy = readKey(value);
    if (legacy) {
      keys.set(ownerId, { xai: legacy });
      continue;
    }
    const owned: StoredOwnerKeys = {};
    for (const provider of AI_PROVIDER_ORDER) {
      const key = readKey((value as Record<string, unknown>)[provider]);
      if (key) owned[provider] = key;
    }
    if (Object.keys(owned).length > 0) keys.set(ownerId, owned);
  }
  return keys;
};

const writeAllKeys = (keys: Map<string, StoredOwnerKeys>) => {
  try {
    if (keys.size === 0) localStorage.removeItem(AI_EXPLAIN_KEYS_KEY);
    else
      localStorage.setItem(
        AI_EXPLAIN_KEYS_KEY,
        JSON.stringify(Object.fromEntries(keys))
      );
  } catch {
    // Storage can throw (e.g. private mode); the key just isn't saved.
  }
  notifyStorage(AI_EXPLAIN_KEYS_KEY);
};

const filledKeys = (owned: StoredOwnerKeys = {}): AiOwnerKeys => {
  const keys = {} as AiOwnerKeys;
  for (const provider of AI_PROVIDER_ORDER)
    keys[provider] = owned[provider] ?? NO_KEY;
  return keys;
};

/** Every provider's key saved for this owner on this device. */
export const readAiOwnerKeys = (ownerId: string): AiOwnerKeys =>
  filledKeys(readAllKeys().get(ownerId));

/** Whether this owner has any key saved on this device. */
export const hasSavedAiKey = (ownerId: string) => readAllKeys().has(ownerId);

/** Saves one provider's key of this owner; an empty `apiKey` deletes it. */
export const writeAiProviderKey = (
  ownerId: string,
  provider: AiProvider,
  key: AiOwnerKey
) => {
  const keys = readAllKeys();
  const owned = { ...keys.get(ownerId) };
  if (key.apiKey === "") delete owned[provider];
  else owned[provider] = { apiKey: key.apiKey, keyValid: key.keyValid };
  if (Object.keys(owned).length === 0) keys.delete(ownerId);
  else keys.set(ownerId, owned);
  writeAllKeys(keys);
};

/** Every owner with a key saved on this device. */
export const listAiKeyOwners = () => [...readAllKeys().keys()];

/** Deletes every key of this owner (logout). */
export const deleteAiOwnerKeys = (ownerId: string) => {
  const keys = readAllKeys();
  if (!keys.delete(ownerId)) return;
  writeAllKeys(keys);
};

/**
 * The provider refused `apiKey`: mark it unusable, unless the owner has since
 * saved a different key.
 */
export const rejectAiProviderKey = (
  ownerId: string,
  provider: AiProvider,
  apiKey: string
) => {
  if (readAiOwnerKeys(ownerId)[provider].apiKey !== apiKey) return;
  writeAiProviderKey(ownerId, provider, { apiKey, keyValid: false });
};

/**
 * Before keys were per owner, the one key lived in the shared preferences.
 * Move it to the guest (who owned everything saved then) and drop it from
 * there. Module-level: runs once when this file loads.
 */
const moveSharedKeyToGuest = () => {
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_EXPLAIN_SETTINGS_KEY,
    null
  );
  if (!raw || typeof raw !== "object") return;
  if (!("apiKey" in raw) && !("keyValid" in raw)) return;
  const { apiKey, keyValid, ...preferences } = raw;
  if (
    typeof apiKey === "string" &&
    apiKey !== "" &&
    readAiOwnerKeys(GUEST_OWNER_ID).xai.apiKey === ""
  )
    writeAiProviderKey(GUEST_OWNER_ID, "xai", {
      apiKey,
      keyValid: keyValid === true,
    });
  try {
    localStorage.setItem(AI_EXPLAIN_SETTINGS_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can throw (e.g. private mode); this runs again next load.
  }
};
moveSharedKeyToGuest();
moveLegacyChoicesToTools();

/**
 * The shared preferences plus this owner's keys. While the owner is unknown
 * nobody's keys are used, so AI features read as not set up.
 */
export const readAiExplainSettings = (
  owner: ContentOwner = getCurrentOwner()
): AiExplainSettings => ({
  ...readAiExplainPreferences(),
  keys:
    owner.status === "known" ? readAiOwnerKeys(owner.ownerId) : filledKeys(),
});

export const hasValidKey = (
  settings: Pick<AiExplainSettings, "keys">,
  provider: AiProvider
) => settings.keys[provider].apiKey !== "" && settings.keys[provider].keyValid;

/**
 * Providers whose key can start something on its own. Read Aloud only reads
 * an essay another tool wrote, so a speech-only key (ElevenLabs) isn't one.
 */
export const STARTER_PROVIDERS = AI_PROVIDER_ORDER.filter((provider) =>
  AI_TOOL_ORDER.some(
    (tool) =>
      tool !== "readAloud" && AI_TOOLS[tool].providers.includes(provider)
  )
);

/**
 * The switch can only be turned on with one working key from a provider that
 * can start something; one is enough.
 */
export const hasStarterAiKey = (settings: Pick<AiExplainSettings, "keys">) =>
  STARTER_PROVIDERS.some((provider) => hasValidKey(settings, provider));

/** A tool's choice with its provider settled and that provider's key. */
export type ResolvedAiTool = AiToolChoice & {
  provider: AiProvider;
  apiKey: string;
  /** The provider's key works. */
  ready: boolean;
};

/**
 * Which provider a tool uses now: the one picked while its key works, else
 * the first in the tool's list whose key works. A model or voice picked for
 * another provider is left out.
 */
export const resolveAiTool = (
  settings: AiExplainSettings,
  tool: AiTool
): ResolvedAiTool => {
  const choice = settings.tools[tool] ?? {};
  const { providers } = AI_TOOLS[tool];
  const picked =
    choice.provider && providers.includes(choice.provider)
      ? choice.provider
      : undefined;
  const provider =
    picked && hasValidKey(settings, picked)
      ? picked
      : (providers.find((option) => hasValidKey(settings, option)) ??
        picked ??
        providers[0]);
  const own = provider === choice.provider;
  return {
    ...choice,
    model: own ? choice.model : undefined,
    voice: own ? choice.voice : undefined,
    voiceName: own ? choice.voiceName : undefined,
    provider,
    apiKey: settings.keys[provider].apiKey,
    ready: hasValidKey(settings, provider),
  };
};

/** The tool's button shows: switched on, and its provider's key works. */
export const isAiToolReady = (settings: AiExplainSettings, tool: AiTool) =>
  settings.enabled && resolveAiTool(settings, tool).ready;

/** Kanji Essay and Anchor Word Essay search the web unless switched off. */
export const usesWebSearch = (choice: AiToolChoice | undefined) =>
  choice?.webSearch !== false;

/**
 * The prompt to send: the sentence prompt, or the word prompt when `word`.
 * A prompt without the placeholder gets the text appended.
 */
export const buildAiExplainPrompt = (
  settings: AiExplainSettings,
  japaneseText: string,
  word = false
) => {
  const template = word
    ? (settings.wordPrompt ?? DEFAULT_AI_EXPLAIN_WORD_PROMPT)
    : (settings.prompt ?? DEFAULT_AI_EXPLAIN_PROMPT);
  if (!template.includes(JAPANESE_TEXT_PLACEHOLDER)) {
    return `${template}\n\nJapanese text: ${japaneseText}`;
  }
  return template.split(JAPANESE_TEXT_PLACEHOLDER).join(japaneseText);
};

/** One provider's requests this month, in its own units. */
export type AiProviderUsage = {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  /** All tokens, including requests that reported only a total. */
  tokens: number;
  searches: number;
  /** Searched requests whose reply didn't say how often it searched. */
  unreportedSearches: number;
  images: number;
  speechRequests: number;
  characters: number;
  credits: number;
  reportedCostUsd: number;
};

/**
 * Usage this calendar month, per provider, counted in this browser only. A
 * new month starts from zero.
 */
export type AiExplainUsage = {
  month: string;
  providers: Partial<Record<AiProvider, AiProviderUsage>>;
};

export const EMPTY_PROVIDER_USAGE: AiProviderUsage = {
  requests: 0,
  inputTokens: 0,
  outputTokens: 0,
  tokens: 0,
  searches: 0,
  unreportedSearches: 0,
  images: 0,
  speechRequests: 0,
  characters: 0,
  credits: 0,
  reportedCostUsd: 0,
};

/** "2026-10" in the user's time zone. */
const monthOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const countOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;

const readProviderUsage = (value: unknown): AiProviderUsage => {
  const raw = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  const usage = { ...EMPTY_PROVIDER_USAGE };
  for (const key of Object.keys(usage) as (keyof AiProviderUsage)[])
    usage[key] = countOf(raw[key]);
  return usage;
};

export const readAiExplainUsage = (now = new Date()): AiExplainUsage => {
  const month = monthOf(now);
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_EXPLAIN_USAGE_KEY,
    null
  );
  if (!raw || raw.month !== month) return { month, providers: {} };
  // Before providers, the month's totals were all xAI's.
  if (raw.providers === undefined) {
    if (typeof raw.tokens !== "number" || typeof raw.requests !== "number")
      return { month, providers: {} };
    return {
      month,
      providers: {
        xai: {
          ...EMPTY_PROVIDER_USAGE,
          requests: countOf(raw.requests),
          tokens: countOf(raw.tokens),
          searches: countOf(raw.searchCalls),
          unreportedSearches: countOf(raw.unreportedSearchRequests),
          images: countOf(raw.imageRequests),
          speechRequests: countOf(raw.audioRequests),
          characters: countOf(raw.audioCharacters),
          reportedCostUsd: countOf(raw.reportedCostUsd),
        },
      },
    };
  }
  const providers: AiExplainUsage["providers"] = {};
  if (raw.providers && typeof raw.providers === "object")
    for (const provider of AI_PROVIDER_ORDER) {
      const value = (raw.providers as Record<string, unknown>)[provider];
      if (value) providers[provider] = readProviderUsage(value);
    }
  return { month, providers };
};

/** Counts one finished request. */
export const addAiUsage = (record: AiUsageRecord) => {
  const usage = readAiExplainUsage();
  const current = usage.providers[record.provider] ?? EMPTY_PROVIDER_USAGE;
  const input = record.inputTokens ?? 0;
  const output = record.outputTokens ?? 0;
  const next: AiProviderUsage = {
    requests: current.requests + 1,
    inputTokens: current.inputTokens + input,
    outputTokens: current.outputTokens + output,
    tokens: current.tokens + (record.totalTokens ?? input + output),
    searches: current.searches + (record.searches ?? 0),
    unreportedSearches:
      current.unreportedSearches + (record.searches === null ? 1 : 0),
    images: current.images + (record.images ?? 0),
    speechRequests:
      current.speechRequests + (record.characters === undefined ? 0 : 1),
    characters: current.characters + (record.characters ?? 0),
    credits: current.credits + (record.credits ?? 0),
    reportedCostUsd: current.reportedCostUsd + (record.reportedCostUsd ?? 0),
  };
  try {
    localStorage.setItem(
      AI_EXPLAIN_USAGE_KEY,
      JSON.stringify({
        month: usage.month,
        providers: { ...usage.providers, [record.provider]: next },
      })
    );
  } catch {
    // Storage can throw (e.g. private mode); the usage just isn't counted.
  }
  notifyStorage(AI_EXPLAIN_USAGE_KEY);
};
