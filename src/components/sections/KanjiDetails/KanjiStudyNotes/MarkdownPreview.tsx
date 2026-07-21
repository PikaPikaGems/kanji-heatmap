import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
} from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkDirective from "remark-directive";
import { StudyNoteVocabButton } from "./StudyNoteVocabButton";
import { remarkJapaneseVocab } from "./markdown";

type MarkdownSpanProps = ComponentPropsWithoutRef<"span"> & ExtraProps;

/** Keep GitHub-style defaults, plus vocab data-* attrs on spans. */
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "data*"],
  },
};

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

const MarkdownSpan = ({ node, children }: MarkdownSpanProps) => {
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

  // Do not forward arbitrary hast props (event handlers, styles, etc.).
  return <span>{children}</span>;
};

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-3.5 mb-2 text-2xl font-bold leading-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1.5 text-xl font-bold leading-snug">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2.5 mb-1 text-lg font-semibold leading-snug">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-2.5">{children}</p>,
  ul: ({ children }) => <ul className="my-2.5 pl-5 list-disc">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-2.5 pl-5 list-decimal">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2.5 pl-3.5 italic border-l-[3px] border-muted-foreground/40 text-muted-foreground">
      {children}
    </blockquote>
  ),
  // Fenced blocks are <pre><code>; keep line boxes tight (parent uses leading-7).
  pre: ({ children }) => (
    <pre className="my-2.5 overflow-x-auto rounded bg-muted-foreground/10 p-3 font-mono text-sm leading-none whitespace-pre [&_code]:m-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:leading-none">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="m-0 px-2 py-0.5 text-green-500 font-mono text-[0.875em] rounded-lg bg-muted-foreground/10">
      {children}
    </code>
  ),
  a: ({ href, children }) => {
    // defaultUrlTransform already strips javascript:/data:/etc.; empty means blocked.
    if (href == null || href.length === 0) {
      return <>{children}</>;
    }

    const external = isExternalHref(href);
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        className="font-bold underline hover-text-theme-color-with-opacity-100"
      >
        {children}
      </a>
    );
  },
  span: MarkdownSpan,
};

export const MarkdownPreview = ({
  source,
  onEmptyClick,
}: {
  source: string;
  /** When set, the empty state becomes a control that starts editing. */
  onEmptyClick?: () => void;
}) => {
  if (source.trim().length === 0) {
    if (onEmptyClick != null) {
      return (
        <button
          type="button"
          onClick={onEmptyClick}
          className="block w-full px-4 pb-8 text-base text-center pt-11 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Your notes are empty. Start writing to see them here.
        </button>
      );
    }

    return (
      <p className="px-4 pb-8 text-base text-center pt-11 text-muted-foreground">
        Your notes are empty. Start writing to see them here.
      </p>
    );
  }

  return (
    <div className="px-4 text-base leading-7 text-left break-words min-h-40">
      <ReactMarkdown
        remarkPlugins={[remarkDirective, remarkJapaneseVocab]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
        skipHtml
        urlTransform={defaultUrlTransform}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
};
