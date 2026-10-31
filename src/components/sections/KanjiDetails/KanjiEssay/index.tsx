import { SectionLoading } from "@/components/common/SectionLoading";
import { useEffect, useId, useState } from "react";
import { getKanjiEssayUrl } from "@/lib/kanji-essays";
import { OwnedAiContent } from "@/components/common/OwnedAiContent";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DefaultErrorFallback } from "@/components/error/DefaultErrorFallback";
import { HighlightKanjiSwitch } from "../KanjiStudyNotes/HighlightKanjiSwitch";
import { MarkdownPreview } from "../KanjiStudyNotes/MarkdownPreview";
import { AiKanjiEssay } from "../AiContent/AiKanjiEssay";
import { AiAudio } from "../AiContent/AiAudio";

type EssayState =
  | { status: "loading" }
  | { status: "ready"; markdown: string | null }
  | { status: "error"; message: string };

/** Which essay the section shows: the one we publish, or the user's own. */
type EssaySource = "published" | "mine";

const EssaySourceSwitch = ({
  source,
  onSourceChange,
}: {
  source: EssaySource;
  onSourceChange: (source: EssaySource) => void;
}) => {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={source === "mine"}
        onCheckedChange={(mine) => onSourceChange(mine ? "mine" : "published")}
      />
      <Label htmlFor={id} className="text-xs font-bold cursor-pointer">
        Show my AI essay
      </Label>
    </div>
  );
};

const PublishedEssay = ({
  kanji,
  markdown,
}: {
  kanji: string;
  markdown: string;
}) => (
  <>
    <HighlightKanjiSwitch className="pl-2" />
    <div className="rounded-xl border border-foreground/20 py-4">
      <MarkdownPreview source={markdown} />
    </div>
    <AiAudio
      key={markdown}
      sourceId={`published-essay:${kanji}`}
      markdown={markdown}
      filename={`kanji-essay-${kanji}`}
    />
  </>
);

const PublishedEssaySection = ({
  kanji,
  state,
  onRetry,
}: {
  kanji: string;
  state: EssayState;
  onRetry: () => void;
}) => {
  if (state.status === "loading")
    return <SectionLoading label="Loading essay" />;
  if (state.status === "error")
    return (
      <div className="space-y-3 p-4 text-center">
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
        <Button variant="outline" onClick={onRetry}>
          Retry loading essay
        </Button>
      </div>
    );
  if (!state.markdown)
    return (
      <DefaultErrorFallback
        message="No essay for this kanji yet."
        showDefaultCta={false}
      />
    );
  return <PublishedEssay kanji={kanji} markdown={state.markdown} />;
};

const KanjiEssay = ({ kanji, keyword }: { kanji: string; keyword: string }) => {
  const url = getKanjiEssayUrl(kanji, keyword);
  const [source, setSource] = useState<EssaySource>("published");
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

  return (
    <div className="space-y-4">
      <div className="pl-2">
        <EssaySourceSwitch source={source} onSourceChange={setSource} />
      </div>
      {/* Keyed so each switch remounts and fades in instead of snapping. */}
      <div key={source} className="space-y-4 animate-fade-in-fast">
        {source === "mine" ? (
          // Waits for the owner, then swaps (and fades in) on login/logout.
          <OwnedAiContent>
            <AiKanjiEssay key={kanji} kanji={kanji} keyword={keyword} />
          </OwnedAiContent>
        ) : (
          <PublishedEssaySection
            kanji={kanji}
            state={state}
            onRetry={() => setRetry((value) => value + 1)}
          />
        )}
      </div>
    </div>
  );
};

export default KanjiEssay;
