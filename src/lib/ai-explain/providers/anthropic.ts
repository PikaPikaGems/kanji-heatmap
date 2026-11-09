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
  type AiProviderClient,
  type TextRequest,
} from "./types";

/**
 * Anthropic (Claude). Browser calls need the
 * `anthropic-dangerous-direct-browser-access` header: the key is the
 * learner's own, typed into their own browser.
 */
const BASE_URL = "https://api.anthropic.com/v1";

const authHeaders = (apiKey: string) => ({
  "x-api-key": apiKey,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
});

/** The newer search tool runs on recent Opus and Sonnet; Haiku keeps the basic one. */
const SEARCH_TOOLS = ["web_search_20260209", "web_search_20250305"];

const searchToolFor = (model: string) =>
  /haiku/.test(model) ? SEARCH_TOOLS[1] : SEARCH_TOOLS[0];

const responseError = async (res: Response): Promise<Error> => {
  if (res.status === 401)
    return new AiKeyRejectedError("anthropic", "Anthropic");
  const { message } = await readErrorBody(res);
  if (res.status === 429)
    return new Error(
      `Anthropic: rate limited. Try again in a minute.${message ? ` (${message})` : ""}`
    );
  if (res.status === 400 && /credit balance/i.test(message))
    return new Error(
      "Anthropic: your credit balance is too low. Add credits at console.anthropic.com."
    );
  if (res.status === 403)
    return new Error(
      `Anthropic denied access${message ? `: ${message}` : ". Check the key's workspace permissions."}`
    );
  return new Error(message || `Anthropic request failed (${res.status}).`);
};

const listModels = async (apiKey: string): Promise<string[]> => {
  const res = await fetch(`${BASE_URL}/models?limit=100`, {
    headers: authHeaders(apiKey),
  });
  if (!res.ok) throw await responseError(res);
  return arrayOf(asRecord(await res.json()).data)
    .map((model) => asRecord(model).id)
    .filter((id): id is string => typeof id === "string")
    .sort();
};

const postMessages = (request: TextRequest, searchTool: string) =>
  fetch(`${BASE_URL}/messages`, {
    method: "POST",
    headers: {
      ...authHeaders(request.apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: 16000,
      stream: true,
      messages: [{ role: "user", content: request.prompt }],
      ...(request.search
        ? { tools: [{ type: searchTool, name: "web_search", max_uses: 5 }] }
        : {}),
    }),
    signal: request.signal,
  });

/**
 * Streams one answer from the Messages API. With search, a model that
 * rejects the newer search tool is asked again with the other one.
 */
const streamText = async (request: TextRequest) => {
  const preferred = searchToolFor(request.model);
  let res = await postMessages(request, preferred);
  if (res.status === 400 && request.search) {
    const { message } = await readErrorBody(res.clone());
    if (/web_search|tool/i.test(message))
      res = await postMessages(
        request,
        SEARCH_TOOLS.find((tool) => tool !== preferred) ?? preferred
      );
  }
  if (!res.ok) throw await responseError(res);

  let text = "";
  /** A tool call or result came after the last text: start a new paragraph. */
  let afterTool = false;
  let searched = false;
  let stopReason = "";
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  let searches: number | undefined;
  const citations = sourceCollector();
  const results = sourceCollector();
  await readEvents(res, (event) => {
    if (event.type === "error")
      throw new Error(
        asRecord(event.error).message
          ? `Anthropic: ${String(asRecord(event.error).message)}`
          : "The explanation did not finish. Try again."
      );
    if (event.type === "message_start") {
      const usage = asRecord(asRecord(event.message).usage);
      inputTokens = numberOf(usage.input_tokens);
      outputTokens = numberOf(usage.output_tokens);
    }
    if (event.type === "content_block_start") {
      const block = asRecord(event.content_block);
      if (block.type !== "text") {
        // A short line before the first search ("I'll search for…") isn't
        // part of the answer.
        if (!searched && text.trim().length < 300) {
          text = "";
          request.onText(text);
        }
        searched = true;
        afterTool = true;
      }
      if (block.type === "web_search_tool_result")
        for (const result of arrayOf(block.content)) results.add(result);
    }
    if (event.type === "content_block_delta") {
      const delta = asRecord(event.delta);
      if (delta.type === "citations_delta") citations.add(delta.citation);
      if (delta.type !== "text_delta" || typeof delta.text !== "string") return;
      if (afterTool && text && !text.endsWith("\n")) text += "\n\n";
      afterTool = false;
      text += delta.text;
      request.onText(text);
    }
    if (event.type === "message_delta") {
      const usage = asRecord(event.usage);
      inputTokens = numberOf(usage.input_tokens) ?? inputTokens;
      outputTokens = numberOf(usage.output_tokens) ?? outputTokens;
      searches = numberOf(asRecord(usage.server_tool_use).web_search_requests);
      const reason = asRecord(event.delta).stop_reason;
      if (typeof reason === "string") stopReason = reason;
    }
  });
  if (stopReason !== "end_turn" && stopReason !== "stop_sequence")
    throw unfinishedError();
  if (!text.trim()) throw emptyReplyError();
  const cited = citations.list();
  return {
    text,
    // Cited pages when the answer cites; else the pages it searched.
    sources: cited.length > 0 ? cited : results.list().slice(0, 8),
    usage: {
      provider: "anthropic" as const,
      inputTokens,
      outputTokens,
      searches: request.search ? (searches ?? 0) : undefined,
    },
  };
};

export const anthropicClient: AiProviderClient = {
  listModels: (apiKey, kind) =>
    kind === "text" ? listModels(apiKey) : Promise.resolve([]),
  checkKey: async (apiKey) => {
    try {
      await listModels(apiKey);
      return "valid";
    } catch (error) {
      if (error instanceof AiKeyRejectedError) return "rejected";
      throw error;
    }
  },
  streamText,
};
