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
import { elevenlabsClient } from "./elevenlabs";
import { geminiClient } from "./gemini";
import { openaiClient } from "./openai";
import { AiVoiceUnavailableError } from "./shared";
import { xaiClient } from "./xai";

/** The client of each provider. */
const CLIENTS: Partial<Record<AiProvider, AiProviderClient>> = {
  xai: xaiClient,
  openai: openaiClient,
  anthropic: anthropicClient,
  gemini: geminiClient,
  elevenlabs: elevenlabsClient,
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

/** Images over this size are re-encoded as WebP before saving. */
const LARGE_IMAGE_BYTES = 600 * 1024;

/**
 * Re-encodes a large image as WebP, keeping whichever is smaller. Browsers
 * without OffscreenCanvas keep the original.
 */
const shrinkLargeImage = async (blob: Blob): Promise<Blob> => {
  if (blob.size <= LARGE_IMAGE_BYTES || typeof OffscreenCanvas === "undefined")
    return blob;
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    bitmap.close();
    const smaller = await canvas.convertToBlob({
      type: "image/webp",
      quality: 0.85,
    });
    return smaller.size < blob.size ? smaller : blob;
  } catch {
    return blob;
  }
};

export const generateProviderImage = async (
  provider: AiProvider,
  request: ImageRequest
): Promise<BlobReply> => {
  const generate = clientOf(provider).generateImage;
  if (!generate) throw unsupported(provider, "draw images");
  const reply = await generate(request);
  return { ...reply, blob: await shrinkLargeImage(reply.blob) };
};

export const generateProviderSpeech = (
  provider: AiProvider,
  request: SpeechRequest
): Promise<BlobReply> => {
  const generate = clientOf(provider).generateSpeech;
  if (!generate) throw unsupported(provider, "read aloud");
  return generate(request);
};

/**
 * Reads `text` aloud with the tool's provider. With no voice picked, a
 * provider whose voices are listed online picks one (ElevenLabs: the first
 * Japanese library voice). A picked voice that has since gone is swapped for
 * that default once, and `replacedVoice` says so.
 */
export const speakWithProvider = async (
  provider: AiProvider,
  request: Omit<SpeechRequest, "voice"> & { voice: string | undefined }
): Promise<
  BlobReply & {
    voice: string;
    /** Set when the default stood in for the picked voice or none. */
    pickedVoice?: { id: string; name: string };
    replacedVoice: boolean;
  }
> => {
  const client = clientOf(provider);
  const fallback = client.defaultVoice;
  if (!request.voice && fallback) {
    const pickedVoice = await fallback(request.apiKey);
    const reply = await generateProviderSpeech(provider, {
      ...request,
      voice: pickedVoice.id,
    });
    return {
      ...reply,
      voice: pickedVoice.id,
      pickedVoice,
      replacedVoice: false,
    };
  }
  const voice = request.voice ?? "";
  try {
    const reply = await generateProviderSpeech(provider, { ...request, voice });
    return { ...reply, voice, replacedVoice: false };
  } catch (error) {
    if (!(error instanceof AiVoiceUnavailableError) || !fallback) throw error;
    const pickedVoice = await fallback(request.apiKey);
    const reply = await generateProviderSpeech(provider, {
      ...request,
      voice: pickedVoice.id,
    });
    return {
      ...reply,
      voice: pickedVoice.id,
      pickedVoice,
      replacedVoice: true,
    };
  }
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
