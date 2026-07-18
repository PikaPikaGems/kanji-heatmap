import { Loader2 } from "lucide-react";
import { useTextFetch } from "@/hooks/use-json";
import { renderMarkdown } from "@/lib/render-markdown";
import { cn } from "@/lib/utils";

const markdownArticleClass = cn(
  "text-left",
  "[&_h1]:mb-6 [&_h1]:scroll-m-20 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight lg:[&_h1]:text-5xl",
  "[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:scroll-m-20 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2:first-child]:mt-0",
  "[&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:scroll-m-20 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight",
  "[&_p]:mb-4 [&_p]:leading-7",
  "[&>p:has(>em:only-child)]:mb-6 [&>p:has(>em:only-child)]:text-sm [&>p:has(>em:only-child)]:italic [&>p:has(>em:only-child)]:text-muted-foreground",
  "[&_ul]:my-6 [&_ul]:ml-6 [&_ul]:list-disc [&_ul>li]:mt-2",
  "[&_ol]:my-6 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol>li]:mt-2",
  "[&_strong]:font-bold"
);

type MarkdownDocProps = {
  /** Public path, e.g. `/md/about.md` */
  path: string;
};

export const MarkdownDoc = ({ path }: MarkdownDocProps) => {
  const { status, data, error } = useTextFetch(path);

  if (status === "idle" || status === "pending") {
    return (
      <div
        className="flex w-full items-center justify-center py-16"
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  }

  if (status === "error" || data == null) {
    return (
      <p className="py-16 text-center text-muted-foreground" role="alert">
        {error?.message ?? "Failed to load document."}
      </p>
    );
  }

  return (
    <article
      className={markdownArticleClass}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(data) }}
    />
  );
};
