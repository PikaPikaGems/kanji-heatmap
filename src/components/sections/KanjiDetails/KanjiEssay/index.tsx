import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getKanjiEssayUrl } from "@/lib/kanji-essays";
import { useAiExplainSettings } from "@/hooks/use-ai-explain";
import { isAiExplainReady } from "@/lib/ai-explain/preferences";
import {
  AI_GENERATED_CONTENT_EVENT,
  getTextResult,
} from "@/lib/ai-explain/storage";
import { Button } from "@/components/ui/button";
import { HighlightKanjiSwitch } from "../KanjiStudyNotes/HighlightKanjiSwitch";
import { MarkdownPreview } from "../KanjiStudyNotes/MarkdownPreview";
import { AiKanjiEssay } from "../AiContent/AiKanjiEssay";
import { AiAudio } from "../AiContent/AiAudio";

type EssayState =
  | { status: "loading" }
  | { status: "ready"; markdown: string | null }
  | { status: "error"; message: string };

const PublishedEssay = ({
  kanji,
  keyword,
  markdown,
  aiReady,
}: {
  kanji: string;
  keyword: string;
  markdown: string;
  aiReady: boolean;
}) => {
  const [saved, setSaved] = useState(false);
  const [viewSaved, setViewSaved] = useState(false);
  // Effect needed: checks IndexedDB and listens for saved essay changes; database
  // reads are asynchronous and event subscriptions require unmount cleanup.
  useEffect(() => {
    if (!aiReady) return;
    let active = true;
    let version = 0;
    const load = async () => {
      const current = ++version;
      try {
        const result = await getTextResult(`essay:${kanji}`);
        if (active && current === version) setSaved(Boolean(result));
      } catch {
        /* Published essays remain readable if local storage is unavailable. */
      }
    };
    void load();
    window.addEventListener(AI_GENERATED_CONTENT_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(AI_GENERATED_CONTENT_EVENT, load);
    };
  }, [kanji, aiReady]);

  if (aiReady && saved && viewSaved)
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setViewSaved(false)}>
          Back to published essay
        </Button>
        <AiKanjiEssay kanji={kanji} keyword={keyword} />
      </div>
    );

  return (
    <div className="space-y-4">
      <HighlightKanjiSwitch className="pb-3 pl-2 sm:justify-end" />
      <div className="rounded-xl border border-foreground/20 py-4">
        <MarkdownPreview source={markdown} />
      </div>
      {aiReady && (
        <AiAudio
          key={markdown}
          sourceId={`published-essay:${kanji}`}
          markdown={markdown}
          filename={`kanji-essay-${kanji}`}
        />
      )}
      {aiReady && saved && (
        <Button variant="ghost" size="sm" onClick={() => setViewSaved(true)}>
          View saved AI essay
        </Button>
      )}
    </div>
  );
};

const KanjiEssay = ({ kanji, keyword }: { kanji: string; keyword: string }) => {
  const url = getKanjiEssayUrl(kanji, keyword);
  const [settings] = useAiExplainSettings();
  const [state, setState] = useState<EssayState>(() =>
    url ? { status: "loading" } : { status: "ready", markdown: null }
  );
  const [retry, setRetry] = useState(0);

  // Effect needed: fetches the published Markdown from an external URL, with
  // cancellation on unmount; render and event handlers cannot perform mount loading.
  useEffect(() => {
    if (!url) {
      setState({ status: "ready", markdown: null });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    const load = async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (response.status === 404) {
          if (!controller.signal.aborted)
            setState({ status: "ready", markdown: null });
          return;
        }
        if (!response.ok)
          throw new Error(`Couldn't load this essay (${response.status}).`);
        if (response.headers.get("content-type")?.includes("text/html")) {
          const html = await response.text();
          // Vite and SPA hosts serve our index document for a missing .md file.
          // Recognize our app shell rather than treating any HTML error as absent.
          if (/id=["']root["']/.test(html) && /Kanji Heatmap/.test(html)) {
            if (!controller.signal.aborted)
              setState({ status: "ready", markdown: null });
            return;
          }
          throw new Error(
            "The essay server returned a page instead of an essay. Please try again."
          );
        }
        const markdown = await response.text();
        if (!controller.signal.aborted)
          setState({
            status: "ready",
            markdown: markdown.trim() ? markdown : null,
          });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Couldn't load this essay.",
          });
      }
    };
    void load();
    return () => controller.abort();
  }, [url, retry]);

  if (state.status === "loading")
    return (
      <div
        role="status"
        aria-label="Loading essay"
        className="flex h-48 items-center justify-center"
      >
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  if (state.status === "error")
    return (
      <div className="space-y-3 p-4 text-center">
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
        <Button
          variant="outline"
          onClick={() => setRetry((value) => value + 1)}
        >
          Retry loading essay
        </Button>
      </div>
    );
  const aiReady = isAiExplainReady(settings);
  if (!state.markdown)
    return (
      <div className="space-y-4">
        {!aiReady && (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No essay for this kanji yet.
          </p>
        )}
        {aiReady && (
          <AiKanjiEssay key={kanji} kanji={kanji} keyword={keyword} />
        )}
      </div>
    );
  return (
    <PublishedEssay
      key={kanji}
      kanji={kanji}
      keyword={keyword}
      markdown={state.markdown}
      aiReady={aiReady}
    />
  );
};

export default KanjiEssay;
