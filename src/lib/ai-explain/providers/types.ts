/**
 * What every AI provider client takes and returns. Each client lives in its
 * own file next to this one and is called straight from the browser: the key
 * never touches our servers.
 */
export type AiProvider =
  | "xai"
  | "openai"
  | "anthropic"
  | "gemini"
  | "elevenlabs";

/** What a model does; picks which models a picker lists. */
export type AiModelKind = "text" | "image" | "speech";

export type AiSource = { url: string; title: string };

/**
 * One finished request, in the provider's own units. Only what the provider
 * reported is set; money only when its API returned an amount.
 */
export type AiUsageRecord = {
  provider: AiProvider;
  inputTokens?: number;
  outputTokens?: number;
  /** When the provider reports only a total. */
  totalTokens?: number;
  /** Web searches; null when the reply searched but didn't say how often. */
  searches?: number | null;
  images?: number;
  /** Characters sent to a speech model. */
  characters?: number;
  /** ElevenLabs credits charged. */
  credits?: number;
  /** US$ the provider's API reported for this request (xAI only). */
  reportedCostUsd?: number;
};

/** The provider refused the key: malformed, expired or revoked. */
export class AiKeyRejectedError extends Error {
  readonly provider: AiProvider;
  constructor(provider: AiProvider, label: string) {
    super(`${label} rejected the API key. Check it in AI Study Tools.`);
    this.name = "AiKeyRejectedError";
    this.provider = provider;
  }
}

export type TextRequest = {
  apiKey: string;
  model: string;
  prompt: string;
  /** Lets the model search the web (Kanji Essay, Anchor Word Essay). */
  search: boolean;
  signal: AbortSignal;
  /** The whole text so far, after each streamed piece. */
  onText: (text: string) => void;
};

export type TextReply = {
  text: string;
  sources: AiSource[];
  usage: AiUsageRecord;
};

export type ImageRequest = {
  apiKey: string;
  model: string;
  prompt: string;
  /** xAI only. */
  resolution: "1k" | "2k";
  /** xAI and OpenAI. */
  quality: "low" | "medium";
  signal: AbortSignal;
};

export type SpeechRequest = {
  apiKey: string;
  model: string;
  text: string;
  voice: string;
  /** MP3 bits per second, where the provider lets us choose. */
  bitRate: number;
  /** xAI's language mode. */
  language: "auto" | "ja";
  /** How to speak (OpenAI, Gemini). */
  instructions: string;
  signal: AbortSignal;
};

export type BlobReply = { blob: Blob; usage: AiUsageRecord };

/** What one provider can do; a missing function means it can't. */
export type AiProviderClient = {
  /** Costs nothing. Throws when the provider can't be reached. */
  checkKey: (apiKey: string) => Promise<"valid" | "rejected">;
  listModels?: (apiKey: string, kind: AiModelKind) => Promise<string[]>;
  streamText?: (request: TextRequest) => Promise<TextReply>;
  generateImage?: (request: ImageRequest) => Promise<BlobReply>;
  generateSpeech?: (request: SpeechRequest) => Promise<BlobReply>;
};
