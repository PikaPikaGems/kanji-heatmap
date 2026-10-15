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

  // Effect needed: reads IndexedDB and subscribes to external storage changes;
  // render cannot await the database, and cleanup must abort requests on unmount.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
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
        request.current?.abort();
        request.current = null;
        setState({ status: "ready" });
      }
      void load();
    };
    void load();
    window.addEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    return () => {
      mounted = false;
      request.current?.abort();
      request.current = null;
      window.removeEventListener(AI_GENERATED_CONTENT_EVENT, changed);
    };
  }, [id]);

  /** Resolves true when a new result is showing. */
  const generate = async (instructions: string): Promise<boolean> => {
    if (request.current || state.status === "loading") return false;
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
          message:
            error instanceof Error
              ? error.message
              : "Couldn't generate this answer. Please try again.",
        });
      }
      return false;
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  const cancel = () => {
    request.current?.abort();
    request.current = null;
    setState({ status: "ready", result: state.result });
  };

  return { state, generate, cancel };
};
