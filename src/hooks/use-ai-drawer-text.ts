import { describeAiError } from "@/lib/ai-explain/describe-error";
import { useEffect, useRef, useState } from "react";
import {
  AI_GENERATED_CONTENT_EVENT,
  assertStorageAvailable,
  contentFingerprint,
  getTextResult,
  getGeneratedContentEpoch,
  saveTextResult,
  type AiTextResult,
} from "@/lib/ai-explain/storage";
import {
  isAiExplainReady,
  addAiExplainUsage,
  modelOf,
  readAiExplainSettings,
  type AiExplainSettings,
} from "@/lib/ai-explain/preferences";
import { buildRegenerationPrompt } from "@/lib/ai-explain/prompts";
import { streamXaiSearchedCompletion } from "@/lib/ai-explain/xai";
import {
  abortInFlight,
  getInFlight,
  trackInFlight,
} from "@/lib/ai-explain/in-flight";

type TextState = {
  status: "loading" | "ready" | "generating" | "error";
  result?: AiTextResult;
  preview?: string;
  message?: string;
  warning?: string;
};

export const useAiDrawerText = (
  id: string,
  makePrompt: (settings: AiExplainSettings) => string
) => {
  const [state, setState] = useState<TextState>({ status: "loading" });
  const request = useRef<AbortController | null>(null);
  const readVersion = useRef(0);
  const flightKey = `text:${id}`;

  // Effect needed: reads IndexedDB and subscribes to external storage changes;
  // render cannot await the database. A request still running from an
  // earlier mount (the drawer was closed) shows as generating until it lands.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const running = getInFlight(flightKey);
      if (running && !request.current) {
        if (mounted) setState({ status: "generating" });
        await running.settled;
        if (!mounted) return;
      }
      const version = ++readVersion.current;
      try {
        const result = await getTextResult(id);
        if (mounted && version === readVersion.current && !request.current) {
          setState((previous) =>
            previous.warning ? previous : { status: "ready", result }
          );
        }
      } catch {
        if (mounted && version === readVersion.current) {
          setState({
            status: "error",
            message:
              "Couldn't load saved AI content. Reopen this section to try again.",
          });
        }
      }
    };
    const changed = (event: Event) => {
      if ((event as CustomEvent<{ cleared: boolean }>).detail?.cleared) {
        abortInFlight(flightKey);
        request.current = null;
        setState({ status: "ready" });
      }
      void load();
    };
    void load();
    window.addEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    // No abort on unmount: the reply is still saved when it arrives.
    return () => {
      mounted = false;
      request.current = null;
      window.removeEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    };
  }, [id, flightKey]);

  /** Resolves true when a new result is showing. */
  const generate = async (instructions: string): Promise<boolean> => {
    if (request.current || getInFlight(flightKey) || state.status === "loading")
      return false;
    const settings = readAiExplainSettings();
    if (!isAiExplainReady(settings)) return false;
    // New text adds to saved storage; regenerating replaces it.
    if (!state.result) {
      try {
        await assertStorageAvailable("text");
      } catch (error) {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Couldn't check storage. Please try again.",
        });
        return false;
      }
    }
    const controller = new AbortController();
    const epoch = getGeneratedContentEpoch();
    request.current = controller;
    readVersion.current++;
    const previous = state.result;
    const basePrompt = makePrompt(settings);
    const prompt = previous
      ? buildRegenerationPrompt(basePrompt, previous.markdown, instructions)
      : basePrompt;
    setState({ status: "generating", result: previous });
    let finish: () => void = () => {};
    trackInFlight(
      flightKey,
      controller,
      new Promise<void>((resolve) => (finish = resolve))
    );
    try {
      const reply = await streamXaiSearchedCompletion({
        apiKey: settings.apiKey,
        model: modelOf(settings),
        prompt,
        signal: controller.signal,
        onText: (preview) => {
          if (!controller.signal.aborted) {
            setState({ status: "generating", result: previous, preview });
          }
        },
      });
      addAiExplainUsage(reply.totalTokens ?? 0, {
        searchCalls: reply.searchCalls,
        reportedCostUsd: reply.costUsd ?? undefined,
      });
      if (!reply.text.trim())
        throw new Error("Grok returned an empty answer. Please try again.");
      const fingerprint = await contentFingerprint(reply.text);
      if (controller.signal.aborted) return false;
      const result: AiTextResult = {
        id,
        markdown: reply.text,
        sources: reply.sources,
        model: modelOf(settings),
        instructions,
        createdAt: Date.now(),
        fingerprint,
      };
      let warning: string | undefined;
      try {
        await saveTextResult(result, previous?.createdAt, epoch);
      } catch (error) {
        warning =
          error instanceof Error && /newer|changed|another/i.test(error.message)
            ? "A newer result is already saved. This answer is available here to copy or download."
            : "Generated, but couldn't save on this device.";
      }
      if (controller.signal.aborted) return false;
      setState({ status: "ready", result, warning });
      return true;
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({
          status: "error",
          result: previous,
          message: describeAiError(
            error,
            "Couldn't generate this answer. Please try again."
          ),
        });
      }
      return false;
    } finally {
      finish();
      if (request.current === controller) request.current = null;
    }
  };

  const cancel = () => {
    abortInFlight(flightKey);
    request.current = null;
    setState({ status: "ready", result: state.result });
  };

  return { state, generate, cancel };
};
