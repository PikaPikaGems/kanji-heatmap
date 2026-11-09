import type { AiModelKind, AiProvider } from "./types";

/**
 * Which provider can power which tool, and the links and defaults the AI
 * Study Tools window shows. Plain data: the UI reads it without loading any
 * provider client.
 */
export type AiProviderInfo = {
  label: string;
  /** Where to make a key. */
  keyUrl: string;
  keyUrlText: string;
  keyPlaceholder: string;
  /** Permissions a restricted key needs, when the provider has them. */
  keyPermissions?: string;
  /** Where the provider's own spending limit or usage is set. */
  limitsUrl: string;
  /** What its key can power here, in words. */
  powers: string;
  /** The model used until another is picked, per kind it supports. */
  defaultModels: Partial<Record<AiModelKind, string>>;
  /** The only models offered, when the picker must not take others. */
  fixedModels?: Partial<Record<AiModelKind, { id: string; label: string }[]>>;
  /** Read Aloud options it takes. */
  speech?: { bitRate: boolean; language: boolean; instructions: boolean };
  /** Visual Mnemonics options it takes; quality only on matching models. */
  image?: { resolution: boolean; qualityModels?: RegExp };
};

export const AI_PROVIDERS: Record<AiProvider, AiProviderInfo> = {
  xai: {
    label: "xAI (Grok)",
    keyUrl: "https://console.x.ai",
    keyUrlText: "console.x.ai",
    keyPlaceholder: "xai-…",
    limitsUrl: "https://console.x.ai",
    powers: "text · web search · images · speech",
    defaultModels: {
      text: "grok-4.3",
      image: "grok-imagine-image-2.0",
      // xAI speech has no model choice.
      speech: "",
    },
    speech: { bitRate: true, language: true, instructions: false },
    image: { resolution: true, qualityModels: /^grok-imagine-image-2\.0$/ },
  },
  openai: {
    label: "OpenAI",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlText: "platform.openai.com",
    keyPlaceholder: "sk-…",
    limitsUrl: "https://platform.openai.com/settings/organization/limits",
    powers: "text · web search · images · speech",
    defaultModels: {
      text: "gpt-5-mini",
      image: "gpt-image-1-mini",
      speech: "gpt-4o-mini-tts",
    },
    speech: { bitRate: false, language: false, instructions: true },
    image: { resolution: false, qualityModels: /^gpt-image/ },
  },
  anthropic: {
    label: "Anthropic (Claude)",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlText: "console.anthropic.com",
    keyPlaceholder: "sk-ant-…",
    limitsUrl: "https://console.anthropic.com/settings/limits",
    powers: "text · web search",
    defaultModels: { text: "claude-sonnet-5-5" },
  },
  gemini: {
    label: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    keyUrlText: "aistudio.google.com",
    keyPlaceholder: "AIza…",
    limitsUrl: "https://aistudio.google.com/usage",
    powers: "text · Google Search · images · speech",
    defaultModels: {
      text: "gemini-2.5-flash",
      image: "gemini-2.5-flash-image",
      speech: "gemini-2.5-flash-preview-tts",
    },
    // Gemini returns raw audio; we encode the MP3 at the chosen rate.
    speech: { bitRate: true, language: false, instructions: true },
    image: { resolution: false },
  },
  elevenlabs: {
    label: "ElevenLabs",
    keyUrl: "https://elevenlabs.io/app/settings/api-keys",
    keyUrlText: "elevenlabs.io",
    keyPlaceholder: "sk_…",
    keyPermissions: "Text to Speech, Voices: Read, User: Read",
    limitsUrl: "https://elevenlabs.io/app/subscription",
    powers: "speech",
    defaultModels: { speech: "eleven_v3" },
    // Both read Japanese words in Japanese with language_code "ja";
    // eleven_multilingual_v2 ignores the code and reads kanji as Chinese.
    fixedModels: {
      speech: [
        { id: "eleven_v3", label: "Eleven v3 · most natural" },
        { id: "eleven_flash_v2_5", label: "Flash v2.5 · fast" },
      ],
    },
    speech: { bitRate: true, language: false, instructions: false },
  },
};

/** Providers in the order the API keys tab lists them. */
export const AI_PROVIDER_ORDER: AiProvider[] = [
  "xai",
  "openai",
  "anthropic",
  "gemini",
  "elevenlabs",
];

export type AiTool =
  | "anchorWord"
  | "kanjiEssay"
  | "grammar"
  | "vocab"
  | "readAloud"
  | "mnemonics";

export type AiToolInfo = {
  label: string;
  kind: AiModelKind;
  /** Can search the web (and has the switch for it). */
  search: boolean;
  /** Providers that can power it, in the order the picker lists them. */
  providers: AiProvider[];
  description: string;
};

export const AI_TOOLS: Record<AiTool, AiToolInfo> = {
  anchorWord: {
    label: "Anchor Word Essay",
    kind: "text",
    search: true,
    providers: ["xai", "openai", "anthropic", "gemini"],
    description: "Vocabulary details for a kanji's anchor word",
  },
  kanjiEssay: {
    label: "Kanji Essay",
    kind: "text",
    search: true,
    providers: ["xai", "openai", "anthropic", "gemini"],
    description: "A beginner-friendly essay about one kanji",
  },
  grammar: {
    label: "Grammar Explain",
    kind: "text",
    search: false,
    providers: ["xai", "openai", "anthropic", "gemini"],
    description: "✨ AI Explain for a Fill in the Kanji sentence",
  },
  vocab: {
    label: "Vocab Explain",
    kind: "text",
    search: false,
    providers: ["xai", "openai", "anthropic", "gemini"],
    description: "✨ AI Explain in a word's popover",
  },
  readAloud: {
    label: "Read Aloud",
    kind: "speech",
    search: false,
    providers: ["xai", "elevenlabs", "openai", "gemini"],
    description: "MP3 narration of essays",
  },
  mnemonics: {
    label: "Visual Mnemonics",
    kind: "image",
    search: false,
    providers: ["xai", "openai", "gemini"],
    description: "Pictures from your mnemonic scene",
  },
};

export const AI_TOOL_ORDER: AiTool[] = [
  "anchorWord",
  "kanjiEssay",
  "grammar",
  "vocab",
  "readAloud",
  "mnemonics",
];

/** The tools a provider's key can power. */
export const toolsOfProvider = (provider: AiProvider) =>
  AI_TOOL_ORDER.filter((tool) => AI_TOOLS[tool].providers.includes(provider));

export const providerLabel = (provider: AiProvider | undefined) =>
  AI_PROVIDERS[provider ?? "xai"].label;
