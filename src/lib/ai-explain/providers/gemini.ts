import {
  arrayOf,
  asRecord,
  emptyReplyError,
  numberOf,
  readErrorBody,
  readEvents,
  sourceCollector,
  unfinishedError,
} from "./shared";
import {
  AiKeyRejectedError,
  type AiModelKind,
  type AiProviderClient,
  type AiUsageRecord,
  type TextRequest,
} from "./types";

/** Google Gemini (AI Studio keys). Its API allows browser calls. */
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const authHeaders = (apiKey: string) => ({ "x-goog-api-key": apiKey });

const responseError = async (res: Response): Promise<Error> => {
  const { message, code } = await readErrorBody(res);
  if (
    res.status === 401 ||
    (res.status === 400 && /api[ _]?key/i.test(`${message} ${code}`))
  )
    return new AiKeyRejectedError("gemini", "Gemini");
  if (res.status === 429)
    return new Error(
      "Gemini: quota exceeded. The free tier doesn't allow web search or images, and limits requests: enable billing for this project in Google AI Studio, or try again later."
    );
  if (res.status === 403)
    return new Error(
      `Gemini denied access${message ? `: ${message}` : ". Check the key's project in Google AI Studio."}`
    );
  return new Error(message || `Gemini request failed (${res.status}).`);
};

/** Which models each picker lists. */
const KIND_FILTERS: Record<AiModelKind, (id: string) => boolean> = {
  text: (id) =>
    /^gemini/.test(id) &&
    !/(image|tts|embedding|live|audio|native|robotics|computer-use)/.test(id),
  image: (id) => /image/.test(id),
  speech: (id) => /tts/.test(id),
};

const listAllModels = async (apiKey: string): Promise<string[]> => {
  const res = await fetch(`${BASE_URL}/models?pageSize=1000`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) throw await responseError(res);
  return arrayOf(asRecord(await res.json()).models)
    .map(asRecord)
    .filter((model) =>
      arrayOf(model.supportedGenerationMethods).includes("generateContent")
    )
    .map((model) => String(model.name ?? "").replace(/^models\//, ""))
    .filter(Boolean)
    .sort();
};

/** Gemini's usage figures; thinking is billed as output. */
export const geminiUsage = (metadata: unknown): AiUsageRecord => {
  const usage = asRecord(metadata);
  const output =
    (numberOf(usage.candidatesTokenCount) ?? 0) +
    (numberOf(usage.thoughtsTokenCount) ?? 0);
  const input =
    (numberOf(usage.promptTokenCount) ?? 0) +
    (numberOf(usage.toolUsePromptTokenCount) ?? 0);
  return {
    provider: "gemini",
    inputTokens: input,
    outputTokens: output,
    totalTokens: numberOf(usage.totalTokenCount),
  };
};

/** POSTs one generateContent request (not streamed). */
export const generateGeminiContent = async (
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
  signal: AbortSignal
) => {
  const res = await fetch(
    `${BASE_URL}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }
  );
  if (!res.ok) throw await responseError(res);
  return asRecord(await res.json());
};

/** The first inline data part (image or audio) of a reply. */
export const inlineDataOf = (body: Record<string, unknown>) => {
  const candidate = asRecord(arrayOf(body.candidates)[0]);
  for (const part of arrayOf(asRecord(candidate.content).parts)) {
    const data = asRecord(asRecord(part).inlineData);
    if (typeof data.data === "string" && data.data)
      return {
        data: data.data,
        mimeType: typeof data.mimeType === "string" ? data.mimeType : "",
      };
  }
  return undefined;
};

const streamText = async (request: TextRequest) => {
  const { apiKey, model, prompt, search, signal, onText } = request;
  const res = await fetch(
    `${BASE_URL}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(search ? { tools: [{ google_search: {} }] } : {}),
      }),
      signal,
    }
  );
  if (!res.ok) throw await responseError(res);
  let text = "";
  let finishReason = "";
  let metadata: unknown;
  const queries = new Set<string>();
  const sources = sourceCollector();
  await readEvents(res, (event) => {
    if (event.error)
      throw new Error(
        `Gemini: ${String(asRecord(event.error).message ?? "the answer failed.")}`
      );
    if (event.usageMetadata) metadata = event.usageMetadata;
    const candidate = asRecord(arrayOf(event.candidates)[0]);
    for (const part of arrayOf(asRecord(candidate.content).parts)) {
      const piece = asRecord(part);
      // Thought summaries aren't part of the answer.
      if (piece.thought === true || typeof piece.text !== "string") continue;
      text += piece.text;
      onText(text);
    }
    const grounding = asRecord(candidate.groundingMetadata);
    for (const chunk of arrayOf(grounding.groundingChunks))
      sources.add(asRecord(chunk).web);
    for (const query of arrayOf(grounding.webSearchQueries))
      if (typeof query === "string") queries.add(query);
    if (typeof candidate.finishReason === "string")
      finishReason = candidate.finishReason;
  });
  if (finishReason !== "STOP") throw unfinishedError();
  if (!text.trim()) throw emptyReplyError();
  return {
    text,
    sources: sources.list(),
    usage: {
      ...geminiUsage(metadata),
      searches: search ? queries.size : undefined,
    },
  };
};

export const geminiClient: AiProviderClient = {
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
  streamText,
};
