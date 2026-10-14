import { useRef, useState } from "react";
import {
  addAiExplainUsage,
  AI_EXPLAIN_SETTINGS_KEY,
  AI_EXPLAIN_USAGE_KEY,
  readAiExplainUsage,
  buildAiExplainPrompt,
  modelOf,
  readAiExplainSettings,
  writeAiExplainSettings,
  type AiExplainSettings,
} from "@/lib/ai-explain/preferences";
import { streamXaiCompletion, XaiKeyRejectedError } from "@/lib/ai-explain/xai";
import { useStorageValue } from "./use-storage-value";

/** Reactive AI Explain settings + a setter that merges a partial update. */
export const useAiExplainSettings = () => {
  const settings = useStorageValue(
    readAiExplainSettings,
    (key) => key === null || key === AI_EXPLAIN_SETTINGS_KEY
  );
  const update = (patch: Partial<AiExplainSettings>) =>
    writeAiExplainSettings({ ...readAiExplainSettings(), ...patch });
  return [settings, update] as const;
};

/** This month's tokens and requests, counted in this browser. */
export const useAiExplainUsage = () =>
  useStorageValue(
    () => readAiExplainUsage(),
    (key) => key === null || key === AI_EXPLAIN_USAGE_KEY
  );

export type AiExplainState =
  | { status: "idle" }
  | { status: "loading"; text: string }
  | { status: "success"; text: string }
  | { status: "error"; message: string };

/**
 * Finished explanations for this page session, keyed by model + full prompt,
 * so reopening the same sentence doesn't pay for another request.
 */
const explanationCache = new Map<string, string>();

const describeError = (error: unknown) => {
  // fetch() rejects with a TypeError when the request never got a response.
  if (error instanceof TypeError) {
    return "Couldn't reach xAI. Check your connection and try again.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
};

/** Runs one explanation at a time; a new run or `cancel` aborts the last. */
export const useAiExplain = () => {
  const [state, setState] = useState<AiExplainState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  };

  const run = (japaneseText: string, { fresh = false } = {}) => {
    cancel();
    const settings = readAiExplainSettings();
    const model = modelOf(settings);
    const prompt = buildAiExplainPrompt(settings, japaneseText);
    const cacheKey = `${model}\n${prompt}`;

    const cached = explanationCache.get(cacheKey);
    if (cached !== undefined && !fresh) {
      setState({ status: "success", text: cached });
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: "loading", text: "" });
    streamXaiCompletion({
      apiKey: settings.apiKey,
      model,
      prompt,
      signal: controller.signal,
      onText: (text) => setState({ status: "loading", text }),
    }).then(
      ({ text, totalTokens }) => {
        // Before the abort check: a reply that finished was billed even if
        // the modal closed as it arrived.
        addAiExplainUsage(totalTokens ?? 0);
        if (controller.signal.aborted) return;
        explanationCache.set(cacheKey, text);
        setState({ status: "success", text });
      },
      (error: unknown) => {
        // The key stopped working (expired or revoked): hide the button
        // until a working key is entered.
        if (error instanceof XaiKeyRejectedError) {
          writeAiExplainSettings({
            ...readAiExplainSettings(),
            keyValid: false,
          });
        }
        if (controller.signal.aborted) return;
        setState({ status: "error", message: describeError(error) });
      }
    );
  };

  return { state, run, cancel };
};
