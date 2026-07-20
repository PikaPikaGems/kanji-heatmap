import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, {
  type Components,
  type ExtraProps,
} from "react-markdown";
import remarkDirective from "remark-directive";
import { StudyNoteVocabButton } from "./StudyNoteVocabButton";
import { remarkJapaneseVocab } from "./markdown";

type MarkdownSpanProps = ComponentPropsWithoutRef<"span"> & ExtraProps;

const getNodeProperty = (
  node: MarkdownSpanProps["node"],
  ...names: string[]
): string | undefined => {
  for (const name of names) {
    const value = node?.properties?.[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
};

const MarkdownSpan = ({ node, children, ...props }: MarkdownSpanProps) => {
  const word = getNodeProperty(node, "data-vocab-word", "dataVocabWord");
  if (word != null) {
    return (
      <StudyNoteVocabButton
        word={word}
        kana={getNodeProperty(node, "data-vocab-kana", "dataVocabKana")}
        definition={getNodeProperty(
          node,
          "data-vocab-definition",
          "dataVocabDefinition"
        )}
      />
    );
  }

  return <span {...props}>{children}</span>;
};

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-3 mb-2 text-2xl font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-2 text-xl font-bold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2 mb-1 text-lg font-semibold">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2 leading-7">{children}</p>,
  ul: ({ children }) => <ul className="my-2 ml-6 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-6 list-decimal">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="pl-3 my-2 italic border-l-4 border-muted-foreground/40">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="px-1 py-0.5 font-mono text-sm rounded bg-muted">
      {children}
    </code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-semibold underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  span: MarkdownSpan,
};

export const MarkdownPreview = ({ source }: { source: string }) => {
  if (source.trim().length === 0) {
    return (
      <p className="py-8 text-sm text-center text-muted-foreground">
        Nothing to preview yet.
      </p>
    );
  }

  return (
    <div className="min-h-40 text-left break-words">
      <ReactMarkdown
        remarkPlugins={[remarkDirective, remarkJapaneseVocab]}
        components={components}
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </div>
  );
};
