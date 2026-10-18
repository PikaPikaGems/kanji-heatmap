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

export const AI_EXPLAIN_SETTINGS_KEY = "ai-explain-settings";
/** The xAI API key per owner: `{ [ownerId]: { apiKey, keyValid } }`. */
export const AI_EXPLAIN_KEYS_KEY = "ai-explain-keys";
export const AI_EXPLAIN_USAGE_KEY = "ai-explain-usage";
export const AI_SPEECH_VOICES = ["ara", "eve", "rex", "sal", "leo"];
export const DEFAULT_AI_SPEECH_VOICE = "ara";
/** MP3 bit rates xAI accepts (192 kbps left out: no gain for speech). */
export const AI_SPEECH_BIT_RATES = [32000, 64000, 96000, 128000] as const;
export type AiSpeechBitRate = (typeof AI_SPEECH_BIT_RATES)[number];
export const DEFAULT_AI_SPEECH_BIT_RATE: AiSpeechBitRate = 64000;

/** Replaced with the sentence (furigana stripped) before sending. */
export const JAPANESE_TEXT_PLACEHOLDER = "{JAPANESE_TEXT}";

/** Used until the user picks another model in User Preferences. */
export const DEFAULT_AI_EXPLAIN_MODEL = "grok-4.3";

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

/** The xAI key of one owner (a logged-in account, or the guest). */
export type AiOwnerKey = {
  apiKey: string;
  /** True once xAI accepted `apiKey`; reset whenever the key changes. */
  keyValid: boolean;
};

/**
 * Preferences shared by everyone using this browser. Unset `model` / `prompt`
 * mean the defaults above, so improving a default reaches everyone who never
 * edited it. The API key is not here: it belongs to one owner (see below).
 */
export type AiExplainPreferences = {
  enabled: boolean;
  model?: string;
  prompt?: string;
  /** AI Explain's prompt for a single word. */
  wordPrompt?: string;
  /** Optional; when set, User Preferences shows usage as a progress bar. */
  monthlyTokenBudget?: number;
  vocabularyPrompt?: string;
  kanjiEssayPrompt?: string;
  imagePrompt?: string;
  imageStylePrompts?: Partial<Record<ImageStyle, string>>;
  /** The Kanji Heatmap palette prompt (kept under its original key). */
  imagePalettePrompt?: string;
  /** Edited prompts for the other palettes, including Custom. */
  imagePalettePrompts?: Partial<Record<ImagePalette, string>>;
  imageModel?: string;
  imageResolution?: "1k" | "2k";
  imageQuality?: "low" | "medium";
  speechVoice?: string;
  speechBitRate?: AiSpeechBitRate;
  speechLanguage?: "auto" | "ja";
};

/** What AI features read: the shared preferences plus the current owner's key. */
export type AiExplainSettings = AiExplainPreferences & AiOwnerKey;

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

/** Reads the shared preferences, dropping anything malformed. */
export const readAiExplainPreferences = (): AiExplainPreferences => {
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_EXPLAIN_SETTINGS_KEY,
    null
  );
  if (!raw || typeof raw !== "object") return { enabled: false };
  return {
    enabled: raw.enabled === true,
    model: optionalString(raw.model),
    prompt: optionalString(raw.prompt),
    wordPrompt: optionalString(raw.wordPrompt),
    vocabularyPrompt: optionalString(raw.vocabularyPrompt),
    kanjiEssayPrompt: optionalString(raw.kanjiEssayPrompt),
    imagePrompt: optionalString(raw.imagePrompt),
    imagePalettePrompt: optionalString(raw.imagePalettePrompt),
    imageModel: optionalString(raw.imageModel),
    imageResolution: raw.imageResolution === "2k" ? "2k" : "1k",
    imageQuality: raw.imageQuality === "medium" ? "medium" : "low",
    speechVoice: optionalString(raw.speechVoice),
    speechBitRate: AI_SPEECH_BIT_RATES.find(
      (rate) => rate === raw.speechBitRate
    ),
    speechLanguage: raw.speechLanguage === "ja" ? "ja" : "auto",
    imageStylePrompts: readPromptRecord(
      raw.imageStylePrompts,
      Object.keys(IMAGE_STYLE_LABELS) as ImageStyle[]
    ),
    imagePalettePrompts: readPromptRecord(
      raw.imagePalettePrompts,
      Object.keys(IMAGE_PALETTE_LABELS) as ImagePalette[]
    ),
    monthlyTokenBudget:
      typeof raw.monthlyTokenBudget === "number" &&
      Number.isFinite(raw.monthlyTokenBudget) &&
      raw.monthlyTokenBudget > 0
        ? raw.monthlyTokenBudget
        : undefined,
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

const NO_KEY: AiOwnerKey = { apiKey: "", keyValid: false };

/** Owners with a saved key; anything malformed is dropped. */
const readOwnerKeys = (): Map<string, AiOwnerKey> => {
  const raw = safeReadJson<unknown>(AI_EXPLAIN_KEYS_KEY, null);
  const keys = new Map<string, AiOwnerKey>();
  if (!raw || typeof raw !== "object") return keys;
  for (const [ownerId, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object") continue;
    const { apiKey, keyValid } = value as Record<string, unknown>;
    if (typeof apiKey === "string" && apiKey !== "")
      keys.set(ownerId, { apiKey, keyValid: keyValid === true });
  }
  return keys;
};

/** The key saved for this owner on this device (none saved reads as empty). */
export const readAiOwnerKey = (ownerId: string): AiOwnerKey =>
  readOwnerKeys().get(ownerId) ?? NO_KEY;

/** Saves this owner's key; an empty `apiKey` deletes it. */
export const writeAiOwnerKey = (ownerId: string, key: AiOwnerKey) => {
  const keys = readOwnerKeys();
  if (key.apiKey === "") keys.delete(ownerId);
  else keys.set(ownerId, { apiKey: key.apiKey, keyValid: key.keyValid });
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

export const deleteAiOwnerKey = (ownerId: string) =>
  writeAiOwnerKey(ownerId, NO_KEY);

/**
 * xAI refused `apiKey`: mark it unusable, unless the owner has since saved a
 * different key.
 */
export const rejectAiOwnerKey = (ownerId: string, apiKey: string) => {
  if (readAiOwnerKey(ownerId).apiKey !== apiKey) return;
  writeAiOwnerKey(ownerId, { apiKey, keyValid: false });
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
    readAiOwnerKey(GUEST_OWNER_ID).apiKey === ""
  )
    writeAiOwnerKey(GUEST_OWNER_ID, { apiKey, keyValid: keyValid === true });
  try {
    localStorage.setItem(AI_EXPLAIN_SETTINGS_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can throw (e.g. private mode); this runs again next load.
  }
};
moveSharedKeyToGuest();

/**
 * The shared preferences plus this owner's key. While the owner is unknown
 * nobody's key is used, so AI features read as not set up.
 */
export const readAiExplainSettings = (
  owner: ContentOwner = getCurrentOwner()
): AiExplainSettings => ({
  ...readAiExplainPreferences(),
  ...(owner.status === "known" ? readAiOwnerKey(owner.ownerId) : NO_KEY),
});

/** The switch can only be turned on with a key xAI accepted. */
export const hasValidAiExplainKey = (settings: AiExplainSettings) =>
  settings.apiKey !== "" && settings.keyValid;

/** The button shows only when switched on with a key xAI accepted. */
export const isAiExplainReady = (settings: AiExplainSettings) =>
  settings.enabled && hasValidAiExplainKey(settings);

export const modelOf = (settings: AiExplainSettings) =>
  settings.model ?? DEFAULT_AI_EXPLAIN_MODEL;

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

/**
 * Tokens and requests this calendar month, counted in this browser only. A
 * new month starts from zero.
 */
export type AiExplainUsage = {
  month: string;
  tokens: number;
  requests: number;
  imageRequests: number;
  audioRequests: number;
  reportedCostUsd: number;
  audioCharacters: number;
  searchCalls: number;
  unreportedSearchRequests: number;
};

/** "2026-10" in the user's time zone. */
const monthOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const readAiExplainUsage = (now = new Date()): AiExplainUsage => {
  const month = monthOf(now);
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_EXPLAIN_USAGE_KEY,
    null
  );
  if (
    !raw ||
    raw.month !== month ||
    typeof raw.tokens !== "number" ||
    typeof raw.requests !== "number"
  ) {
    return {
      month,
      tokens: 0,
      requests: 0,
      imageRequests: 0,
      audioRequests: 0,
      reportedCostUsd: 0,
      audioCharacters: 0,
      searchCalls: 0,
      unreportedSearchRequests: 0,
    };
  }
  const count = (key: string) =>
    typeof raw[key] === "number" && Number.isFinite(raw[key]) && raw[key] >= 0
      ? (raw[key] as number)
      : 0;
  return {
    month,
    tokens: count("tokens"),
    requests: count("requests"),
    imageRequests: count("imageRequests"),
    audioRequests: count("audioRequests"),
    reportedCostUsd: count("reportedCostUsd"),
    audioCharacters: count("audioCharacters"),
    searchCalls: count("searchCalls"),
    unreportedSearchRequests: count("unreportedSearchRequests"),
  };
};

/** Counts one finished request. */
export const addAiExplainUsage = (
  tokens: number,
  extra: {
    searchCalls?: number | null;
    reportedCostUsd?: number | null;
    imageRequests?: number;
    audioCharacters?: number;
  } = {}
) => {
  const usage = readAiExplainUsage();
  const next: AiExplainUsage = {
    ...usage,
    month: usage.month,
    audioRequests:
      usage.audioRequests + (extra.audioCharacters === undefined ? 0 : 1),
    reportedCostUsd: usage.reportedCostUsd + (extra.reportedCostUsd ?? 0),
    imageRequests: usage.imageRequests + (extra.imageRequests ?? 0),
    audioCharacters: usage.audioCharacters + (extra.audioCharacters ?? 0),
    searchCalls: usage.searchCalls + (extra.searchCalls ?? 0),
    unreportedSearchRequests:
      usage.unreportedSearchRequests + (extra.searchCalls === null ? 1 : 0),
    tokens: usage.tokens + tokens,
    requests: usage.requests + 1,
  };
  try {
    localStorage.setItem(AI_EXPLAIN_USAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can throw (e.g. private mode); the usage just isn't counted.
  }
  notifyStorage(AI_EXPLAIN_USAGE_KEY);
};
