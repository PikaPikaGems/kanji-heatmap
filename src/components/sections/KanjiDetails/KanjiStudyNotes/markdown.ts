import type { Root, RootContent, Text } from "mdast";
import type { Plugin } from "unified";
import { unified } from "unified";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

type DirectiveNode = RootContent & {
  type: "textDirective";
  name: string;
  attributes?: Record<string, string | null>;
  children: RootContent[];
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
};

export type MarkdownHighlightKind =
  | "plain"
  | "heading"
  | "emphasis"
  | "link"
  | "quote"
  | "list"
  | "code"
  | "directive";

export interface MarkdownHighlightSegment {
  kind: MarkdownHighlightKind;
  text: string;
}

const japaneseCharacterPattern =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヵヶー]/u;

const skippedParentTypes = new Set([
  "code",
  "inlineCode",
  "link",
  "linkReference",
  "textDirective",
  "leafDirective",
  "containerDirective",
]);

interface JapaneseSegment {
  segment: string;
  isWordLike?: boolean;
}

interface SegmenterConstructor {
  new (
    locales?: string | string[],
    options?: { granularity: "word" }
  ): {
    segment(input: string): Iterable<JapaneseSegment>;
  };
}

const getJapaneseSegments = (value: string): JapaneseSegment[] => {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor })
    .Segmenter;

  if (Segmenter == null) {
    return value
      .split(
        /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヵヶー]+)/u
      )
      .filter(Boolean)
      .map((segment) => ({
        segment,
        isWordLike: japaneseCharacterPattern.test(segment),
      }));
  }

  return Array.from(
    new Segmenter("ja", { granularity: "word" }).segment(value)
  );
};

const createVocabDirective = (
  word: string,
  attributes: Record<string, string | null> = {}
): DirectiveNode =>
  ({
    type: "textDirective",
    name: "vocab",
    attributes,
    children: [{ type: "text", value: word }],
  }) as DirectiveNode;

const getDirectiveWord = (node: DirectiveNode): string =>
  node.children
    .filter((child): child is Text => child.type === "text")
    .map((child) => child.value)
    .join("");

const configureVocabDirective = (node: DirectiveNode) => {
  const word = getDirectiveWord(node).trim();
  if (word.length === 0) {
    return;
  }

  const kana = node.attributes?.kana?.trim();
  const definition = node.attributes?.definition?.trim();
  const hProperties: Record<string, string> = {
    "data-vocab-word": word,
  };

  if (kana) {
    hProperties["data-vocab-kana"] = kana;
  }
  if (definition) {
    hProperties["data-vocab-definition"] = definition;
  }

  node.data = {
    hName: "span",
    hProperties,
  };
};

/**
 * Converts Japanese words in ordinary Markdown text into inline vocab nodes.
 * Explicit :vocab directives are preserved and may provide kana/definition.
 */
export const remarkJapaneseVocab: Plugin<[], Root> = () => (tree) => {
  visit(tree, "text", (node, index, parent) => {
    if (
      parent == null ||
      index == null ||
      skippedParentTypes.has(parent.type) ||
      !japaneseCharacterPattern.test(node.value)
    ) {
      return;
    }

    const replacement = getJapaneseSegments(node.value).map(
      ({ segment, isWordLike }) =>
        isWordLike && japaneseCharacterPattern.test(segment)
          ? createVocabDirective(segment)
          : ({ type: "text", value: segment } satisfies Text)
    );

    parent.children.splice(index, 1, ...(replacement as RootContent[]));
    return index + replacement.length;
  });

  visit(tree, (node) => {
    if (node.type === "textDirective") {
      const directive = node as DirectiveNode;
      if (directive.name === "vocab") {
        configureVocabDirective(directive);
      }
    }
  });
};

const highlightParser = unified().use(remarkParse).use(remarkDirective);

const highlightKinds: Partial<
  Record<string, { kind: MarkdownHighlightKind; priority: number }>
> = {
  heading: { kind: "heading", priority: 1 },
  blockquote: { kind: "quote", priority: 1 },
  list: { kind: "list", priority: 1 },
  listItem: { kind: "list", priority: 2 },
  emphasis: { kind: "emphasis", priority: 3 },
  strong: { kind: "emphasis", priority: 3 },
  link: { kind: "link", priority: 4 },
  linkReference: { kind: "link", priority: 4 },
  inlineCode: { kind: "code", priority: 5 },
  code: { kind: "code", priority: 5 },
  textDirective: { kind: "directive", priority: 6 },
  leafDirective: { kind: "directive", priority: 6 },
  containerDirective: { kind: "directive", priority: 6 },
};

export const getMarkdownHighlightSegments = (
  source: string
): MarkdownHighlightSegment[] => {
  if (source.length === 0) {
    return [];
  }

  const highlights = Array.from({ length: source.length }, () => ({
    kind: "plain" as MarkdownHighlightKind,
    priority: 0,
  }));
  const tree = highlightParser.parse(source);

  visit(tree, (node) => {
    const highlight = highlightKinds[node.type];
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (highlight == null || start == null || end == null) {
      return;
    }

    for (let index = start; index < end; index += 1) {
      if (highlight.priority >= highlights[index].priority) {
        highlights[index] = highlight;
      }
    }
  });

  const segments: MarkdownHighlightSegment[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const kind = highlights[index].kind;
    const previous = segments[segments.length - 1];
    if (previous?.kind === kind) {
      previous.text += source[index];
    } else {
      segments.push({ kind, text: source[index] });
    }
  }

  return segments;
};
