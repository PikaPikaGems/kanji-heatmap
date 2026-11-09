import {
  arrayOf,
  asRecord,
  emptyReplyError,
  readEvents,
  sourceCollector,
  unfinishedError,
} from "./shared";
import type { AiSource, TextRequest } from "./types";

/**
 * Streams one answer from an OpenAI-style Responses API (xAI and OpenAI
 * both speak it). `usageOf` turns the finished response into the provider's
 * usage figures; `fail` turns a failed HTTP response into an error.
 */
export const streamResponses = async <U>({
  url,
  headers,
  request,
  searchTool,
  fail,
  usageOf,
}: {
  url: string;
  headers: Record<string, string>;
  request: TextRequest;
  /** The provider's web search tool, sent when `request.search`. */
  searchTool: Record<string, unknown>;
  fail: (res: Response) => Promise<Error>;
  usageOf: (response: Record<string, unknown>) => U;
}): Promise<{ text: string; sources: AiSource[]; usage: U }> => {
  const { model, prompt, search, signal, onText } = request;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [{ role: "user", content: prompt }],
      ...(search ? { tools: [searchTool] } : {}),
      stream: true,
      store: false,
    }),
    signal,
  });
  if (!res.ok) throw await fail(res);
  let text = "";
  let outputIndex: unknown;
  let usage: U | undefined;
  const sources = sourceCollector();
  await readEvents(res, (event) => {
    if (
      event.type === "error" ||
      event.type === "response.failed" ||
      event.type === "response.incomplete"
    )
      throw unfinishedError();
    if (
      event.type === "response.output_text.delta" &&
      typeof event.delta === "string"
    ) {
      if (event.output_index !== outputIndex) {
        if (text && !text.endsWith("\n")) text += "\n\n";
        outputIndex = event.output_index;
      }
      text += event.delta;
      onText(text);
    }
    if (event.type === "response.output_text.annotation.added")
      sources.add(event.annotation);
    if (event.type !== "response.completed") return;
    const response = asRecord(event.response);
    if (response.status !== "completed") throw emptyReplyError();
    usage = usageOf(response);
    // Each output item (e.g. text before and after a web search) is its own
    // block; joining them bare can glue a "## Heading" onto the previous line.
    const completedItems: string[] = [];
    for (const item of arrayOf(response.output)) {
      const output = asRecord(item);
      let itemText = "";
      for (const source of arrayOf(asRecord(output.action).sources))
        sources.add(source);
      for (const content of arrayOf(output.content)) {
        const block = asRecord(content);
        if (block.type === "output_text" && typeof block.text === "string")
          itemText += block.text;
        for (const annotation of arrayOf(block.annotations))
          sources.add(annotation);
      }
      if (itemText.trim()) completedItems.push(itemText.trim());
    }
    for (const citation of arrayOf(response.citations)) {
      if (typeof citation === "string") sources.add({ url: citation });
      else sources.add(citation);
    }
    const completedText = completedItems.join("\n\n");
    if (completedText) {
      text = completedText;
      onText(text);
    }
  });
  if (usage === undefined || !text.trim()) throw emptyReplyError();
  return { text, sources: sources.list(), usage };
};
