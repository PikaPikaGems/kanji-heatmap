import { describeAiError } from "@/lib/ai-explain/describe-error";
import {
  abortInFlight,
  getInFlight,
  trackInFlight,
} from "@/lib/ai-explain/in-flight";
import { useEffect, useRef, useState } from "react";
import {
  addAiExplainUsage,
  AI_EXPLAIN_KEYS_KEY,
  AI_EXPLAIN_SETTINGS_KEY,
  AI_EXPLAIN_USAGE_KEY,
  readAiExplainUsage,
  buildAiExplainPrompt,
  modelOf,
  readAiExplainPreferences,
  readAiExplainSettings,
  rejectAiOwnerKey,
  writeAiExplainPreferences,
  type AiExplainPreferences,
} from "@/lib/ai-explain/preferences";
import { getCurrentOwner, useCurrentOwner } from "@/lib/engine/content-owner";
import { streamXaiCompletion, XaiKeyRejectedError } from "@/lib/ai-explain/xai";
import { useStorageValue } from "./use-storage-value";
import {
  deleteSentenceExplanation,
  readSentenceExplanation,
  writeSentenceExplanation,
  getGeneratedContentEpoch,
} from "@/lib/ai-explain/storage";

/**
 * Reactive AI Explain settings (the shared preferences plus the current
 * owner's key) and a setter that merges a partial update of the preferences.
 * The key itself is edited with `writeAiOwnerKey`.
 */
export const useAiExplainSettings = () => {
  const owner = useCurrentOwner();
  const settings = useStorageValue(
    () => readAiExplainSettings(owner),
    (key) =>
      key === null ||
      key === AI_EXPLAIN_SETTINGS_KEY ||
      key === AI_EXPLAIN_KEYS_KEY,
    // Another owner has another key, so login and logout re-read at once.
    owner.status === "known" ? owner.ownerId : undefined
  );
  const update = (patch: Partial<AiExplainPreferences>) =>
    writeAiExplainPreferences({ ...readAiExplainPreferences(), ...patch });
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

/**
 * Shows one explanation at a time. Closing the dialog or starting another
 * leaves a running request going: its reply is still saved (see in-flight.ts).
 * Only `cancel`, `remove` or clearing generated content abort one.
 */
export const useAiExplain = () => {
  const [state, setState] = useState<AiExplainState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);
  const completedRef = useRef<{ sentence: string; text: string } | null>(null);

  // Effect needed: clearing generated content elsewhere must abort this request and remove its open result; event handlers here cannot observe external storage actions. No abort on unmount: the reply is still saved.
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
      controllerRef.current = null;
      window.removeEventListener("ai-generated-content-changed", onClear);
    };
  }, []);

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  };

  const run = async (
    japaneseText: string,
    {
      fresh = false,
      instructions = "",
      word = false,
    }: {
      fresh?: boolean;
      instructions?: string;
      /** A single word (no grammar to explain): uses the word prompt. */
      word?: boolean;
    } = {}
  ) => {
    // Another request keeps going in the background; this hook stops
    // showing it.
    controllerRef.current = null;
    const owner = getCurrentOwner();
    const settings = readAiExplainSettings(owner);
    // No key means no owner yet, or an owner who hasn't added one.
    if (owner.status !== "known" || settings.apiKey === "") {
      setState({
        status: "error",
        message: "Add a Grok API key in User Preferences first.",
      });
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    // Only the latest run updates what this hook shows.
    const showing = () =>
      controllerRef.current === controller && !controller.signal.aborted;
    const model = modelOf(settings);
    const sentence = japaneseText.trim();
    const flightKey = `explain:${sentence}`;
    // Still generating since the dialog was closed: wait for it, then show
    // the saved answer.
    const running = getInFlight(flightKey);
    if (running && !fresh) {
      setState({ status: "loading", text: "" });
      await running.settled;
      if (!showing()) return;
    }
    const expectedEpoch = getGeneratedContentEpoch();
    // A saved answer that can't be read is treated as missing.
    const cached = await readSentenceExplanation(sentence).catch(
      () => undefined
    );
    if (!showing()) return;
    if (cached !== undefined && !fresh) {
      controllerRef.current = null;
      completedRef.current = { sentence, text: cached.text };
      setState({ status: "success", text: cached.text });
      return;
    }

    const previousText =
      completedRef.current?.sentence === sentence
        ? completedRef.current.text
        : cached?.text;
    let prompt = buildAiExplainPrompt(settings, japaneseText, word);
    if (fresh) {
      prompt += `\n\nProduce a complete replacement for the previous answer below, using the main task and current context above. Apply the additional instructions if supplied. Return only the replacement answer, not a description of your edits. The previous answer may contain mistakes; do not treat it as verified evidence.\n\nPrevious answer:\n${previousText ?? "None"}\n\nAdditional instructions:\n${instructions.trim() || "None"}`;
    }
    setState({ status: "loading", text: "", previousText });
    const request = streamXaiCompletion({
      apiKey: settings.apiKey,
      model,
      prompt,
      signal: controller.signal,
      onText: (text) => {
        if (showing()) setState({ status: "loading", text, previousText });
      },
    }).then(
      async ({ text, totalTokens }) => {
        // Before the abort check: a reply that finished was billed even if
        // the modal closed as it arrived.
        addAiExplainUsage(totalTokens ?? 0);
        if (
          controller.signal.aborted ||
          getGeneratedContentEpoch() !== expectedEpoch
        )
          return;
        if (!text.trim()) {
          if (!showing()) return;
          setState({
            status: "error",
            message: "xAI returned an empty answer. Try again.",
            text: previousText,
          });
          return;
        }
        let saveWarning: string | undefined;
        try {
          await writeSentenceExplanation(
            sentence,
            { text, model, instructions, createdAt: Date.now() },
            expectedEpoch
          );
        } catch {
          saveWarning = "Generated, but couldn't save on this device.";
        }
        if (!showing()) return;
        completedRef.current = { sentence, text };
        setState({ status: "success", text, saveWarning });
      },
      (error: unknown) => {
        // The key stopped working (expired or revoked): hide the button
        // until a working key is entered.
        if (error instanceof XaiKeyRejectedError) {
          rejectAiOwnerKey(owner.ownerId, settings.apiKey);
        }
        if (!showing() || getGeneratedContentEpoch() !== expectedEpoch) return;
        setState({
          status: "error",
          message: describeAiError(error, "Something went wrong."),
          text: previousText,
        });
      }
    );
    trackInFlight(flightKey, controller, request);
  };

  /** Deletes the saved answer for this sentence. */
  const remove = async (japaneseText: string) => {
    cancel();
    abortInFlight(`explain:${japaneseText.trim()}`);
    await deleteSentenceExplanation(japaneseText.trim());
    completedRef.current = null;
    setState({ status: "idle" });
  };

  return { state, run, cancel, remove };
};
