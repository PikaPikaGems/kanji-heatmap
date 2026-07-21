import type { ListItem, Root, RootContent, Text } from "mdast";
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
  | "directive"
  | "japanese";

export interface MarkdownHighlightSegment {
  kind: MarkdownHighlightKind;
  text: string;
}

const japaneseCharacterPattern =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヵヶー]/u;

const kanjiCharacterPattern = /[\p{Script=Han}々〆]/u;

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

const hasKanji = (value: string) => kanjiCharacterPattern.test(value);

const getJapaneseSegments = (value: string): JapaneseSegment[] => {
  // Pure kana runs stay intact so "にほんご" is one badge, not に/ほん/ご.
  if (!hasKanji(value)) {
    return [{ segment: value, isWordLike: true }];
  }

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

  // Firefox marks some CJK compounds (電車, 自転車, …) as isWordLike:false
  // even though they are valid words. Ignore that flag for Japanese script
  // segments — we only segment pure Japanese runs here.
  return Array.from(
    new Segmenter("ja", { granularity: "word" }).segment(value)
  ).map(({ segment }) => ({
    segment,
    isWordLike: japaneseCharacterPattern.test(segment),
  }));
};

/**
 * Split text into Japanese runs vs everything else, then word-segment only
 * runs that contain kanji. Pure-kana runs are kept as a single token.
 */
const getVocabReplacementSegments = (value: string): JapaneseSegment[] => {
  const parts = value
    .split(
      /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヵヶー]+)/u
    )
    .filter(Boolean);

  return parts.flatMap((part) => {
    if (!japaneseCharacterPattern.test(part)) {
      return [{ segment: part, isWordLike: false }];
    }
    return getJapaneseSegments(part);
  });
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

    const replacement = getVocabReplacementSegments(node.value).map(
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

/** Japanese may recolor text inside headings/quotes/list markers, but not stronger syntax. */
const JAPANESE_MAX_OVERRIDE_PRIORITY = 2;

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
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start == null || end == null) {
      return;
    }

    // Only tint the list marker (`- `, `1. `), not the bullet body text.
    if (node.type === "listItem") {
      const listItem = node as ListItem;
      const markerEnd = listItem.children[0]?.position?.start.offset ?? end;
      for (let index = start; index < markerEnd; index += 1) {
        if (1 >= highlights[index].priority) {
          highlights[index] = { kind: "list", priority: 1 };
        }
      }
      return;
    }

    const highlight = highlightKinds[node.type];
    if (highlight == null) {
      return;
    }

    for (let index = start; index < end; index += 1) {
      if (highlight.priority >= highlights[index].priority) {
        highlights[index] = highlight;
      }
    }
  });

  // Highlight Japanese runs unless they're already part of stronger syntax
  // (emphasis, links, code, :vocab directives).
  for (let index = 0; index < source.length; ) {
    const char = source[index];
    if (
      japaneseCharacterPattern.test(char) &&
      highlights[index].priority <= JAPANESE_MAX_OVERRIDE_PRIORITY
    ) {
      let end = index + 1;
      while (
        end < source.length &&
        japaneseCharacterPattern.test(source[end]) &&
        highlights[end].priority <= JAPANESE_MAX_OVERRIDE_PRIORITY
      ) {
        end += 1;
      }
      for (let cursor = index; cursor < end; cursor += 1) {
        highlights[cursor] = { kind: "japanese", priority: 2 };
      }
      index = end;
    } else {
      index += 1;
    }
  }

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
