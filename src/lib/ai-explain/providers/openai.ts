import { streamResponses } from "./responses-api";
import { arrayOf, asRecord, numberOf, readErrorBody } from "./shared";
import {
  AiKeyRejectedError,
  type AiModelKind,
  type AiProviderClient,
  type AiUsageRecord,
} from "./types";

/** OpenAI. Its API allows browser calls with the key in the header. */
const BASE_URL = "https://api.openai.com/v1";

const authHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
});

const responseError = async (res: Response): Promise<Error> => {
  if (res.status === 401) return new AiKeyRejectedError("openai", "OpenAI");
  const { message } = await readErrorBody(res);
  if (res.status === 429)
    return new Error(
      `OpenAI: rate limited or out of credits. Check billing at platform.openai.com.${message ? ` (${message})` : ""}`
    );
  if (res.status === 403)
    return new Error(
      `OpenAI denied access${message ? `: ${message}` : ". Check the key's permissions and your organization's verification."}`
    );
  return new Error(message || `OpenAI request failed (${res.status}).`);
};

/** Which model ids each picker lists. */
const KIND_FILTERS: Record<AiModelKind, (id: string) => boolean> = {
  text: (id) =>
    /^(gpt-|o\d|chatgpt-)/.test(id) &&
    !/(audio|realtime|tts|transcribe|image|search|embedding|instruct|codex|moderation|dall-e)/.test(
      id
    ),
  image: (id) => /^gpt-image/.test(id),
  speech: (id) => /tts/.test(id),
};

const listAllModels = async (apiKey: string): Promise<string[]> => {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) throw await responseError(res);
  return arrayOf(asRecord(await res.json()).data)
    .map((model) => asRecord(model).id)
    .filter((id): id is string => typeof id === "string")
    .sort();
};

export const openaiClient: AiProviderClient = {
  listModels: async (apiKey, kind) =>
    (await listAllModels(apiKey)).filter(KIND_FILTERS[kind]),
  checkKey: async (apiKey) => {
    try {
      await listAllModels(apiKey);
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
      fail: responseError,
      usageOf: (response): AiUsageRecord => {
        const usage = asRecord(response.usage);
        return {
          provider: "openai",
          inputTokens: numberOf(usage.input_tokens),
          outputTokens: numberOf(usage.output_tokens),
          totalTokens: numberOf(usage.total_tokens),
          // Each search is its own output item.
          searches: request.search
            ? arrayOf(response.output).filter(
                (item) => asRecord(item).type === "web_search_call"
              ).length
            : undefined,
        };
      },
    }),
};
