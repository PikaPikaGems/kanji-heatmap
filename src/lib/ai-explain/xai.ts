/**
 * Minimal xAI (Grok) client. Called straight from the browser: the API allows
 * any origin, and the key never touches our servers.
 */
const XAI_BASE_URL = "https://api.x.ai/v1";

const authHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
});

/** The key is malformed, expired or revoked. */
export class XaiKeyRejectedError extends Error {
  constructor() {
    super("The API key was rejected. Check it in User Preferences.");
    this.name = "XaiKeyRejectedError";
  }
}

/**
 * The error for a failed response. A bad key is a 401/403, or a 400 whose
 * message is about the key (what xAI sends for a malformed one).
 */
const responseError = async (
  res: Response,
  feature?: "images" | "speech"
): Promise<Error> => {
  if (feature && (res.status === 401 || res.status === 403))
    return new Error(
      `The key could not access ${feature}. Check its endpoint and model permissions in xAI. Text generation remains available.`
    );
  if (res.status === 401 || res.status === 403)
    return new XaiKeyRejectedError();
  if (res.status === 429) {
    return new Error("Rate limited or out of credits. Try again later.");
  }
  let detail = "";
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string") detail = body.error;
    if (
      body.error &&
      typeof body.error === "object" &&
      "message" in body.error &&
      typeof body.error.message === "string"
    )
      detail = body.error.message;
  } catch {
    // Not JSON; fall back to the status code.
  }
  if (res.status === 400 && /api key/i.test(detail)) {
    return new XaiKeyRejectedError();
  }
  return new Error(detail || `Request failed (${res.status}).`);
};

/**
 * Chat model ids the key can use, sorted. Uses /language-models, not
 * /models: xAI answers /models with "Incorrect API key" for some keys that
 * work fine for chat.
 */
export const listXaiModels = async (apiKey: string): Promise<string[]> => {
  const res = await fetch(`${XAI_BASE_URL}/language-models`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) throw await responseError(res);
  const body = (await res.json()) as { models?: { id?: unknown }[] };
  return (body.models ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === "string")
    .sort();
};

/** Whether xAI accepts the key. Costs no tokens. Throws on network errors. */
export const checkXaiKey = async (
  apiKey: string
): Promise<"valid" | "rejected"> => {
  try {
    await listXaiModels(apiKey);
    return "valid";
  } catch (error) {
    if (error instanceof XaiKeyRejectedError) return "rejected";
    throw error;
  }
};

/**
 * Streams a chat completion for `prompt`, calling `onText` with the full text
 * so far after each chunk. Resolves with the final text and the tokens the
 * request used (null if the reply didn't report them).
 */
export const streamXaiCompletion = async ({
  apiKey,
  model,
  prompt,
  signal,
  onText,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  signal: AbortSignal;
  onText: (text: string) => void;
}): Promise<{ text: string; totalTokens: number | null }> => {
  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      model,
      stream: true,
      // The last chunk then carries the request's token usage.
      stream_options: { include_usage: true },
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });
  if (!res.ok) throw await responseError(res);
  if (!res.body) throw new Error("The response was empty.");

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let text = "";
  let totalTokens: number | null = null;
  let pending = "";
  let finished = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += value;
    // Server-sent events: one "data: {json}" per line; keep a partial line.
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") {
        finished = true;
        continue;
      }
      if (data === "") continue;
      const chunk = JSON.parse(data) as {
        choices?: { delta?: { content?: unknown }; finish_reason?: string }[];
        usage?: { total_tokens?: unknown } | null;
      };
      if (chunk.choices?.[0]?.finish_reason === "stop") finished = true;
      const reason = chunk.choices?.[0]?.finish_reason;
      if (reason && reason !== "stop")
        throw new Error(
          "The explanation did not finish. Your saved result has not changed."
        );
      const used = chunk.usage?.total_tokens;
      if (typeof used === "number" && Number.isFinite(used)) {
        totalTokens = used;
      }
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta !== "string" || delta === "") continue;
      text += delta;
      onText(text);
    }
  }
  if (!finished || !text.trim())
    throw new Error("The explanation did not finish. Try again.");
  return { text, totalTokens };
};

export type AiSource = { url: string; title: string };
type StreamOptions = {
  apiKey: string;
  model: string;
  prompt: string;
  signal: AbortSignal;
  onText: (text: string) => void;
};

/** Consume SSE events, including a final event without a trailing newline. */
const readEvents = async (
  res: Response,
  onEvent: (event: Record<string, unknown>) => void
) => {
  if (!res.body) throw new Error("The response was empty.");
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = "";
  const consume = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    onEvent(JSON.parse(data) as Record<string, unknown>);
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += value;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) consume(line);
    }
    if (pending.trim()) consume(pending);
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const arrayOf = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const sourceOf = (value: unknown): AiSource | undefined => {
  const record = asRecord(value);
  const url = record.url;
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return undefined;
  return { url, title: typeof record.title === "string" ? record.title : url };
};

export const streamXaiSearchedCompletion = async ({
  apiKey,
  model,
  prompt,
  signal,
  onText,
}: StreamOptions): Promise<{
  text: string;
  totalTokens: number | null;
  sources: AiSource[];
  searchCalls: number | null;
  costUsd: number | null;
}> => {
  const res = await fetch(`${XAI_BASE_URL}/responses`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      model,
      input: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search" }],
      stream: true,
      store: false,
    }),
    signal,
  });
  if (!res.ok) throw await responseError(res);
  let text = "";
  let completed = false;
  let totalTokens: number | null = null;
  let searchCalls: number | null = null;
  let costUsd: number | null = null;
  const sources = new Map<string, AiSource>();
  const collect = (value: unknown) => {
    const source = sourceOf(value);
    if (source) sources.set(source.url, source);
  };
  await readEvents(res, (event) => {
    if (
      event.type === "error" ||
      event.type === "response.failed" ||
      event.type === "response.incomplete"
    )
      throw new Error(
        "The explanation did not finish. Your saved result has not changed."
      );
    if (
      event.type === "response.output_text.delta" &&
      typeof event.delta === "string"
    ) {
      text += event.delta;
      onText(text);
    }
    if (event.type === "response.output_text.annotation.added")
      collect(event.annotation);
    if (event.type !== "response.completed") return;
    const response = asRecord(event.response);
    if (response.status !== "completed")
      throw new Error("The explanation did not finish. Try again.");
    completed = true;
    const usage = asRecord(response.usage);
    if (typeof usage.total_tokens === "number")
      totalTokens = usage.total_tokens;
    if (typeof usage.cost_in_usd_ticks === "number")
      costUsd = usage.cost_in_usd_ticks / 10000000000;
    const toolUsage = asRecord(
      usage.server_side_tool_usage_details ?? usage.server_side_tool_usage
    );
    if (typeof toolUsage.web_search_calls === "number")
      searchCalls = toolUsage.web_search_calls;
    if (typeof toolUsage.web_search === "number")
      searchCalls = toolUsage.web_search;
    let completedText = "";
    for (const item of arrayOf(response.output)) {
      const output = asRecord(item);
      for (const source of arrayOf(asRecord(output.action).sources))
        collect(source);
      for (const content of arrayOf(output.content)) {
        const block = asRecord(content);
        if (block.type === "output_text" && typeof block.text === "string")
          completedText += block.text;
        for (const annotation of arrayOf(block.annotations))
          collect(annotation);
      }
    }
    for (const citation of arrayOf(response.citations)) {
      if (typeof citation === "string") collect({ url: citation });
      else collect(citation);
    }
    if (completedText) {
      text = completedText;
      onText(text);
    }
  });
  if (!completed || !text.trim())
    throw new Error("The explanation did not finish. Try again.");
  return {
    text,
    totalTokens,
    sources: [...sources.values()],
    searchCalls,
    costUsd,
  };
};
export const generateXaiImage = async ({
  apiKey,
  model,
  prompt,
  resolution,
  quality,
  signal,
  onCost,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  resolution: "1k" | "2k";
  quality: "low" | "medium";
  signal: AbortSignal;
  onCost?: (costUsd: number) => void;
}): Promise<Blob> => {
  const res = await fetch(`${XAI_BASE_URL}/images/generations`, {
    method: "POST",
    headers: authHeaders(apiKey),
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
  const cost = asRecord(body.usage).cost_in_usd_ticks;
  if (typeof cost === "number" && Number.isFinite(cost) && cost >= 0)
    onCost?.(cost / 10000000000);
  const image = asRecord(arrayOf(body.data)[0]);
  if (typeof image.b64_json !== "string" || !image.b64_json)
    throw new Error("No image was returned. The previous image is unchanged.");
  const bytes = Uint8Array.from(atob(image.b64_json), (character) =>
    character.charCodeAt(0)
  );
  const mime =
    bytes[0] === 137 && bytes[1] === 80
      ? "image/png"
      : bytes[0] === 82 && bytes[1] === 73
        ? "image/webp"
        : "image/jpeg";
  return new Blob([bytes], { type: mime });
};
export const generateXaiSpeech = async ({
  apiKey,
  text,
  voice,
  language,
  signal,
}: {
  apiKey: string;
  text: string;
  voice: string;
  language: "auto" | "ja";
  signal: AbortSignal;
}): Promise<Blob> => {
  if (!text.trim()) throw new Error("There is no text to read aloud.");
  if (text.length > 60000)
    throw new Error("This text exceeds the speech limit of 60,000 characters.");
  const res = await fetch(`${XAI_BASE_URL}/tts`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      text,
      voice_id: voice,
      language,
      output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 128000 },
    }),
    signal,
  });
  if (!res.ok) throw await responseError(res, "speech");
  const blob = await res.blob();
  if (!blob.size) throw new Error("No audio was returned. Try again.");
  return new Blob([blob], { type: "audio/mpeg" });
};
