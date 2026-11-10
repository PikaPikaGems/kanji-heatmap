import { streamResponses } from "./responses-api";
import {
  arrayOf,
  asRecord,
  checkSpeechText,
  decodeBase64,
  imageBlob,
  numberOf,
  readErrorBody,
} from "./shared";
import {
  AiKeyRejectedError,
  type AiModelKind,
  type AiProviderClient,
  type AiUsageRecord,
} from "./types";

/** xAI (Grok). Its API allows any origin. */
const BASE_URL = "https://api.x.ai/v1";

const authHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
});

/** xAI reports cost in ticks: 10,000,000,000 ticks are US$1. */
const ticksToUsd = (ticks: unknown) => {
  const value = numberOf(ticks);
  return value === undefined ? undefined : value / 10000000000;
};

/**
 * The error for a failed response. xAI uses 401 for invalid credentials and
 * 403 for a valid key or team that cannot perform the requested action.
 */
const responseError = async (
  res: Response,
  feature?: "images" | "speech"
): Promise<Error> => {
  if (res.status === 401) return new AiKeyRejectedError("xai", "xAI");
  if (res.status === 429) {
    return new Error("xAI: rate limited or out of credits. Try again later.");
  }
  const { message } = await readErrorBody(res);
  if (res.status === 400 && /api key/i.test(message))
    return new AiKeyRejectedError("xai", "xAI");
  if (res.status === 403) {
    const access = feature
      ? `${feature} generation`
      : "the Responses API request, selected model, or web search";
    return new Error(
      `xAI denied access to ${access}. Check the key or team permissions in xAI${message ? `: ${message}` : "."}`
    );
  }
  return new Error(message || `xAI request failed (${res.status}).`);
};

/**
 * Model ids the key can use, sorted. Text uses /language-models, not
 * /models: xAI answers /models with "Incorrect API key" for some keys that
 * work fine for chat.
 */
const listModels = async (
  apiKey: string,
  kind: AiModelKind
): Promise<string[]> => {
  if (kind === "speech") return [];
  const path = kind === "image" ? "image-generation-models" : "language-models";
  const res = await fetch(`${BASE_URL}/${path}`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) throw await responseError(res);
  const body = asRecord(await res.json());
  return arrayOf(body.models)
    .map((model) => asRecord(model).id)
    .filter((id): id is string => typeof id === "string")
    .sort();
};

export const xaiClient: AiProviderClient = {
  listModels,
  checkKey: async (apiKey) => {
    try {
      await listModels(apiKey, "text");
      return "valid";
    } catch (error) {
      if (error instanceof AiKeyRejectedError) return "rejected";
      throw error;
    }
  },
  streamText: (request) =>
    streamResponses({
      url: `${BASE_URL}/responses`,
      headers: authHeaders(request.apiKey),
      request,
      searchTool: { type: "web_search" },
      fail: (res) => responseError(res),
      usageOf: (response): AiUsageRecord => {
        const usage = asRecord(response.usage);
        const tools = asRecord(
          usage.server_side_tool_usage_details ?? usage.server_side_tool_usage
        );
        const searches =
          numberOf(tools.web_search_calls) ?? numberOf(tools.web_search);
        return {
          provider: "xai",
          inputTokens: numberOf(usage.input_tokens),
          outputTokens: numberOf(usage.output_tokens),
          totalTokens: numberOf(usage.total_tokens),
          searches: request.search ? (searches ?? null) : undefined,
          reportedCostUsd: ticksToUsd(usage.cost_in_usd_ticks),
        };
      },
    }),
  generateImage: async ({
    apiKey,
    model,
    prompt,
    resolution,
    quality,
    signal,
  }) => {
    const res = await fetch(`${BASE_URL}/images/generations`, {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        aspect_ratio: "1:1",
        resolution,
        ...(model === "grok-imagine-image-2.0" ? { quality } : {}),
        response_format: "b64_json",
      }),
      signal,
    });
    if (!res.ok) throw await responseError(res, "images");
    const body = asRecord(await res.json());
    const image = asRecord(arrayOf(body.data)[0]);
    if (typeof image.b64_json !== "string" || !image.b64_json)
      throw new Error(
        "No image was returned. The previous image is unchanged."
      );
    return {
      blob: imageBlob(decodeBase64(image.b64_json)),
      usage: {
        provider: "xai",
        images: 1,
        reportedCostUsd: ticksToUsd(asRecord(body.usage).cost_in_usd_ticks),
      },
    };
  },
  generateSpeech: async ({
    apiKey,
    text,
    voice,
    language,
    bitRate,
    signal,
  }) => {
    checkSpeechText(text, 60000);
    const res = await fetch(`${BASE_URL}/tts`, {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice_id: voice,
        language,
        output_format: { codec: "mp3", sample_rate: 24000, bit_rate: bitRate },
      }),
      signal,
    });
    if (!res.ok) throw await responseError(res, "speech");
    const blob = await res.blob();
    if (!blob.size) throw new Error("No audio was returned. Try again.");
    return {
      blob: new Blob([blob], { type: "audio/mpeg" }),
      usage: { provider: "xai", characters: text.length },
    };
  },
};
