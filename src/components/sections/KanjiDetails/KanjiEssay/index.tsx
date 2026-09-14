import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useAsync } from "@/hooks/use-json";
import { getKanjiEssayUrl } from "@/lib/kanji-essays";
import { MarkdownPreview } from "../KanjiStudyNotes/MarkdownPreview";
import { DefaultErrorFallback } from "@/components/error";

const EssayLoading = () => (
  <div
    className="flex items-center justify-center w-full h-48"
    role="status"
    aria-label="Loading"
  >
    <Loader2 className="size-7 animate-spin" />
  </div>
);

const fetchEssayMarkdown = async (url: string): Promise<string | null> => {
  const response = await fetch(url);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch text: ${response.status} ${response.statusText}`
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    return null;
  }
  return response.text();
};

const KanjiEssay = ({ kanji, keyword }: { kanji: string; keyword: string }) => {
  const url = getKanjiEssayUrl(kanji, keyword);
  // Needed: useAsync re-fetches when the function identity changes.
  const fetchEssay = useCallback(async () => {
    if (url == null) {
      return null;
    }
    return fetchEssayMarkdown(url);
  }, [url]);
  const { status, data, error } = useAsync(fetchEssay, url != null);

  if (url == null) {
    return (
      <DefaultErrorFallback
        message={error?.message ?? "No essay for this kanji yet."}
        showDefaultCta={false}
      />
    );
  }

  if (status === "idle" || status === "pending") {
    return <EssayLoading />;
  }

  if (status === "error") {
    return (
      <DefaultErrorFallback
        message={error?.message ?? "No essay for this kanji yet."}
        showDefaultCta={false}
      />
    );
  }

  if (data == null || data.trim().length === 0) {
    return (
      <DefaultErrorFallback
        message={error?.message ?? "No essay for this kanji yet."}
        showDefaultCta={false}
      />
    );
  }

  return (
    <div className="py-4 border border-foreground/20 rounded-xl">
      <MarkdownPreview source={data} />
    </div>
  );
};

export default KanjiEssay;
