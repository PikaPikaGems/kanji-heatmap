import { useEffect, useRef, useState } from "react";
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
import {
  readSentenceExplanation,
  writeSentenceExplanation,
  getGeneratedContentEpoch,
} from "@/lib/ai-explain/storage";

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
  | { status: "loading"; text: string; previousText?: string }
  | { status: "success"; text: string; saveWarning?: string }
  | { status: "error"; message: string; text?: string };

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
  const completedRef = useRef<{ sentence: string; text: string } | null>(null);

  // Effect needed: clearing generated content elsewhere must abort this request and remove its open result; event handlers here cannot observe external storage actions.
  useEffect(() => {
    const onClear = (event: Event) => {
      if (!(event instanceof CustomEvent) || !event.detail?.cleared) return;
      controllerRef.current?.abort();
      controllerRef.current = null;
      completedRef.current = null;
      setState({ status: "idle" });
    };
    window.addEventListener("ai-generated-content-changed", onClear);
    return () => {
      controllerRef.current?.abort();
      window.removeEventListener("ai-generated-content-changed", onClear);
    };
  }, []);

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  };

  const run = (
    japaneseText: string,
    { fresh = false, instructions = "" } = {}
  ) => {
    cancel();
    const settings = readAiExplainSettings();
    const model = modelOf(settings);
    const sentence = japaneseText.trim();
    const expectedEpoch = getGeneratedContentEpoch();
    const cached = readSentenceExplanation(sentence);
    if (cached !== undefined && !fresh) {
      completedRef.current = { sentence, text: cached.text };
      setState({ status: "success", text: cached.text });
      return;
    }

    const previousText =
      completedRef.current?.sentence === sentence
        ? completedRef.current.text
        : cached?.text;
    let prompt = buildAiExplainPrompt(settings, japaneseText);
    if (fresh) {
      prompt += `\n\nProduce a complete replacement for the previous answer below, using the main task and current context above. Apply the additional instructions if supplied. Return only the replacement answer, not a description of your edits. The previous answer may contain mistakes; do not treat it as verified evidence.\n\nPrevious answer:\n${previousText ?? "None"}\n\nAdditional instructions:\n${instructions.trim() || "None"}`;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: "loading", text: "", previousText });
    streamXaiCompletion({
      apiKey: settings.apiKey,
      model,
      prompt,
      signal: controller.signal,
      onText: (text) => {
        if (!controller.signal.aborted)
          setState({ status: "loading", text, previousText });
      },
    }).then(
      ({ text, totalTokens }) => {
        // Before the abort check: a reply that finished was billed even if
        // the modal closed as it arrived.
        addAiExplainUsage(totalTokens ?? 0);
        if (
          controller.signal.aborted ||
          getGeneratedContentEpoch() !== expectedEpoch
        )
          return;
        if (!text.trim()) {
          setState({
            status: "error",
            message: "xAI returned an empty answer. Try again.",
            text: previousText,
          });
          return;
        }
        let saveWarning: string | undefined;
        try {
          writeSentenceExplanation(
            sentence,
            { text, model, prompt, instructions, createdAt: Date.now() },
            expectedEpoch
          );
        } catch {
          saveWarning = "Generated, but couldn't save on this device.";
        }
        completedRef.current = { sentence, text };
        setState({ status: "success", text, saveWarning });
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
        if (
          controller.signal.aborted ||
          getGeneratedContentEpoch() !== expectedEpoch
        )
          return;
        setState({
          status: "error",
          message: describeError(error),
          text: previousText,
        });
      }
    );
  };

  return { state, run, cancel };
};
