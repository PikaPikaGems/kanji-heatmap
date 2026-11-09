import { AI_PROVIDERS } from "./capabilities";
import type {
  AiModelKind,
  AiProvider,
  AiProviderClient,
  BlobReply,
  ImageRequest,
  SpeechRequest,
  TextReply,
  TextRequest,
} from "./types";
import { anthropicClient } from "./anthropic";
import { geminiClient } from "./gemini";
import { openaiClient } from "./openai";
import { xaiClient } from "./xai";

/** The client of each provider. */
const CLIENTS: Partial<Record<AiProvider, AiProviderClient>> = {
  xai: xaiClient,
  openai: openaiClient,
  anthropic: anthropicClient,
  gemini: geminiClient,
};

/** The provider's client; throws for one this build has no client for. */
export const clientOf = (provider: AiProvider): AiProviderClient => {
  const client = CLIENTS[provider];
  if (!client)
    throw new Error(`${AI_PROVIDERS[provider].label} isn't supported yet.`);
  return client;
};

const unsupported = (provider: AiProvider, what: string) =>
  new Error(`${AI_PROVIDERS[provider].label} can't ${what} here.`);

export const streamProviderText = (
  provider: AiProvider,
  request: TextRequest
): Promise<TextReply> => {
  const stream = clientOf(provider).streamText;
  if (!stream) throw unsupported(provider, "write text");
  return stream(request);
};

export const generateProviderImage = (
  provider: AiProvider,
  request: ImageRequest
): Promise<BlobReply> => {
  const generate = clientOf(provider).generateImage;
  if (!generate) throw unsupported(provider, "draw images");
  return generate(request);
};

export const generateProviderSpeech = (
  provider: AiProvider,
  request: SpeechRequest
): Promise<BlobReply> => {
  const generate = clientOf(provider).generateSpeech;
  if (!generate) throw unsupported(provider, "read aloud");
  return generate(request);
};

/** The model a tool uses: the one picked, else the provider's default. */
export const modelFor = (
  provider: AiProvider,
  kind: AiModelKind,
  picked: string | undefined
) => picked || (AI_PROVIDERS[provider].defaultModels[kind] ?? "");

/**
 * Model lists already fetched this session, per key and kind, so the six
 * tool pickers don't each fetch the same list. A failed fetch isn't kept.
 */
const modelLists = new Map<string, Promise<string[]>>();

export const listProviderModels = (
  provider: AiProvider,
  kind: AiModelKind,
  apiKey: string
): Promise<string[]> => {
  const list = clientOf(provider).listModels;
  if (!list) return Promise.resolve([]);
  const cacheKey = JSON.stringify([provider, kind, apiKey]);
  const cached = modelLists.get(cacheKey);
  if (cached) return cached;
  const request = list(apiKey, kind);
  modelLists.set(cacheKey, request);
  request.catch(() => modelLists.delete(cacheKey));
  return request;
};

export type { AiProvider } from "./types";
