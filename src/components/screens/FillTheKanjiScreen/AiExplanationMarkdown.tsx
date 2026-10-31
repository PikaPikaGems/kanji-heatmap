import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
} from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { isJapanese } from "wanakana";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { remarkJapaneseVocab } from "@/components/sections/KanjiDetails/KanjiStudyNotes/markdown";
import {
  getNodeProperty,
  sanitizeSchema,
} from "@/components/sections/KanjiDetails/KanjiStudyNotes/markdown-sanitize";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { cn, isKanji } from "@/lib/utils";
import { KanjiPopover } from "@/components/shared-practice/KanjiPopover";

type SpanProps = ComponentPropsWithoutRef<"span"> & ExtraProps;

/** Each kanji opens its popover; kana between them (okurigana) stays text. */
const KanjiWord = ({ word }: { word: string }) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  return (
    <span className="kanji-font" lang="ja">
      {[...word].map((char, i) => {
        const info = isKanji(char) ? getKanjiInfo?.(char) : null;
        if (!info) return <span key={i}>{char}</span>;
        return (
          <KanjiPopover
            key={i}
            kanji={char}
            info={info}
            className="underline decoration-dotted decoration-foreground/40 underline-offset-[5px]"
          />
        );
      })}
    </span>
  );
};

/**
 * A Japanese word found by remarkJapaneseVocab. Kana-only words are a
 * romaji toggle that reads like plain text with a dotted underline.
 */
const JapaneseSpan = ({ node, children }: SpanProps) => {
  const word = getNodeProperty(node, "data-vocab-word", "dataVocabWord");
  if (word == null) return <span>{children}</span>;
  if ([...word].some((char) => isKanji(char))) return <KanjiWord word={word} />;
  if (!isJapanese(word)) return word;
  return (
    <RomajiBadge
      kana={word}
      showFocusRing={false}
      className={cn(
        "m-0 px-0 py-0 sm:py-0 rounded-none border-0 bg-transparent text-[length:inherit] sm:text-[length:inherit] font-normal",
        "underline decoration-dotted decoration-foreground/40 underline-offset-[5px]",
        "hover:bg-transparent hover:text-lime-600 dark:hover:text-lime-500"
      )}
    />
  );
};

/** Small, flat styles: the reply is a few labeled lines, not a document. */
const components: Components = {
  h1: ({ children }) => <p className="mt-3 font-bold first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mt-3 font-bold first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mt-3 font-bold first:mt-0">{children}</p>,
  h4: ({ children }) => <p className="mt-3 font-bold first:mt-0">{children}</p>,
  p: ({ children }) => <p className="my-2 first:mt-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="pl-5 my-1 space-y-1 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="pl-6 my-1 space-y-1 list-decimal">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  hr: () => <hr className="my-3 border-dotted border-border" />,
  code: ({ children }) => <code className="font-mono">{children}</code>,
  pre: ({ children }) => <pre className="whitespace-pre-wrap">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="pl-3 border-l-2 text-muted-foreground">
      {children}
    </blockquote>
  ),
  // Links in a model's reply aren't trusted; show their text only.
  a: ({ children }) => <>{children}</>,
  img: () => null,
  span: JapaneseSpan,
};

/**
 * The model's reply as Markdown. Raw HTML is skipped and the tree is
 * sanitized, so nothing in the reply can inject markup.
 */
export const AiExplanationMarkdown = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => (
  <div className={cn("text-sm leading-7 break-words", className)}>
    <ReactMarkdown
      // No remark-directive: "word:text" in a reply must stay text, not
      // become a directive. remarkJapaneseVocab makes its own nodes.
      remarkPlugins={[remarkJapaneseVocab]}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      components={components}
      skipHtml
      urlTransform={defaultUrlTransform}
    >
      {text}
    </ReactMarkdown>
  </div>
);
