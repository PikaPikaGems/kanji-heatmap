import type { ImageStyle } from "./prompts";
import { notifyStorage, safeReadJson } from "@/lib/storage";

export const AI_EXPLAIN_SETTINGS_KEY = "ai-explain-settings";
export const AI_EXPLAIN_USAGE_KEY = "ai-explain-usage";
export const AI_SPEECH_VOICES = ["ara", "eve", "rex", "sal", "leo"];
export const DEFAULT_AI_SPEECH_VOICE = "ara";

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

/**
 * Unset `model` / `prompt` mean the defaults above, so improving a default
 * reaches everyone who never edited it.
 */
export type AiExplainSettings = {
  enabled: boolean;
  apiKey: string;
  /** True once xAI accepted `apiKey`; reset whenever the key changes. */
  keyValid: boolean;
  model?: string;
  prompt?: string;
  /** Optional; when set, User Preferences shows usage as a progress bar. */
  monthlyTokenBudget?: number;
  vocabularyPrompt?: string;
  kanjiEssayPrompt?: string;
  imagePrompt?: string;
  imageStylePrompts?: Partial<Record<ImageStyle, string>>;
  imagePalettePrompt?: string;
  imageModel?: string;
  imageResolution?: "1k" | "2k";
  imageQuality?: "low" | "medium";
  speechVoice?: string;
  speechLanguage?: "auto" | "ja";
};

const optionalString = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v : undefined;

const readStylePrompts = (
  value: unknown
): Partial<Record<ImageStyle, string>> => {
  if (!value || typeof value !== "object") return {};
  const result: Partial<Record<ImageStyle, string>> = {};
  for (const key of [
    "kanji-heatmap",
    "watercolor",
    "pixel-art",
    "cartoon",
    "custom",
  ] as const) {
    const prompt = optionalString((value as Record<string, unknown>)[key]);
    if (prompt) result[key] = prompt;
  }
  return result;
};

/** Reads the saved settings, dropping anything malformed. */
export const readAiExplainSettings = (): AiExplainSettings => {
  const raw = safeReadJson<Record<string, unknown> | null>(
    AI_EXPLAIN_SETTINGS_KEY,
    null
  );
  if (!raw || typeof raw !== "object")
    return { enabled: false, apiKey: "", keyValid: false };
  return {
    enabled: raw.enabled === true,
    apiKey: typeof raw.apiKey === "string" ? raw.apiKey : "",
    keyValid: raw.keyValid === true,
    model: optionalString(raw.model),
    prompt: optionalString(raw.prompt),
    vocabularyPrompt: optionalString(raw.vocabularyPrompt),
    kanjiEssayPrompt: optionalString(raw.kanjiEssayPrompt),
    imagePrompt: optionalString(raw.imagePrompt),
    imagePalettePrompt: optionalString(raw.imagePalettePrompt),
    imageModel: optionalString(raw.imageModel),
    imageResolution: raw.imageResolution === "2k" ? "2k" : "1k",
    imageQuality: raw.imageQuality === "medium" ? "medium" : "low",
    speechVoice: optionalString(raw.speechVoice),
    speechLanguage: raw.speechLanguage === "ja" ? "ja" : "auto",
    imageStylePrompts: readStylePrompts(raw.imageStylePrompts),
    monthlyTokenBudget:
      typeof raw.monthlyTokenBudget === "number" &&
      Number.isFinite(raw.monthlyTokenBudget) &&
      raw.monthlyTokenBudget > 0
        ? raw.monthlyTokenBudget
        : undefined,
  };
};

export const writeAiExplainSettings = (settings: AiExplainSettings) => {
  try {
    localStorage.setItem(AI_EXPLAIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can throw (e.g. private mode); the settings just aren't saved.
  }
  notifyStorage(AI_EXPLAIN_SETTINGS_KEY);
};

/** The switch can only be turned on with a key xAI accepted. */
export const hasValidAiExplainKey = (settings: AiExplainSettings) =>
  settings.apiKey !== "" && settings.keyValid;

/** The button shows only when switched on with a key xAI accepted. */
export const isAiExplainReady = (settings: AiExplainSettings) =>
  settings.enabled && hasValidAiExplainKey(settings);

export const modelOf = (settings: AiExplainSettings) =>
  settings.model ?? DEFAULT_AI_EXPLAIN_MODEL;

/** The prompt to send. A prompt without the placeholder gets the text appended. */
export const buildAiExplainPrompt = (
  settings: AiExplainSettings,
  japaneseText: string
) => {
  const template = settings.prompt ?? DEFAULT_AI_EXPLAIN_PROMPT;
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
