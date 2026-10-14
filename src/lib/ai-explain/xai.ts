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
const responseError = async (res: Response): Promise<Error> => {
  if (res.status === 401 || res.status === 403)
    return new XaiKeyRejectedError();
  if (res.status === 429) {
    return new Error("Rate limited or out of credits. Try again later.");
  }
  let detail = "";
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string") detail = body.error;
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
      if (data === "" || data === "[DONE]") continue;
      const chunk = JSON.parse(data) as {
        choices?: { delta?: { content?: unknown } }[];
        usage?: { total_tokens?: unknown } | null;
      };
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
  return { text, totalTokens };
};
