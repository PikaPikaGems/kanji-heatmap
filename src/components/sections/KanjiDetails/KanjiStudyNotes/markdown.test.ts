import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { getMarkdownHighlightSegments, remarkJapaneseVocab } from "./markdown";

interface VocabNodeSnapshot {
  word: string;
  attributes?: Record<string, string | null>;
  properties?: Record<string, string>;
}

const parseMarkdown = (source: string) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkJapaneseVocab);
  return processor.runSync(processor.parse(source));
};

const getVocabNodes = (source: string): VocabNodeSnapshot[] => {
  const nodes: VocabNodeSnapshot[] = [];

  visit(parseMarkdown(source), (node) => {
    const candidate = node as unknown as {
      type: string;
      name?: string;
      attributes?: Record<string, string | null>;
      children?: Array<{ type: string; value?: string }>;
      data?: { hProperties?: Record<string, string> };
    };
    if (candidate.type !== "textDirective" || candidate.name !== "vocab") {
      return;
    }

    nodes.push({
      word:
        candidate.children
          ?.filter((child) => child.type === "text")
          .map((child) => child.value ?? "")
          .join("") ?? "",
      attributes: candidate.attributes,
      properties: candidate.data?.hProperties,
    });
  });

  return nodes;
};

describe("remarkJapaneseVocab", () => {
  it("turns Japanese text into vocab nodes automatically", () => {
    expect(
      getVocabNodes("Learn 日本語 today").map((node) => node.word)
    ).toEqual(["日本語"]);
  });

  it("segments Japanese sentences without requiring spaces", () => {
    const words = getVocabNodes("日本語を勉強する").map((node) => node.word);

    expect(words.length).toBeGreaterThan(1);
    expect(words.join("")).toBe("日本語を勉強する");
  });

  it("preserves optional directive metadata", () => {
    const [node] = getVocabNodes(
      ':vocab[日本語]{kana="にほんご" definition="Japanese language"}'
    );

    expect(node.properties).toEqual({
      "data-vocab-word": "日本語",
      "data-vocab-kana": "にほんご",
      "data-vocab-definition": "Japanese language",
    });
  });

  it("does not convert Japanese text inside code or links", () => {
    expect(getVocabNodes("`日本語` and [日本語](https://example.com)")).toEqual(
      []
    );
  });
});

describe("getMarkdownHighlightSegments", () => {
  it("identifies common Markdown and vocab directive syntax", () => {
    const segments = getMarkdownHighlightSegments(
      '# Heading\n\n**bold** [link](/docs) :vocab[日本語]{kana="にほんご"}'
    );
    const kinds = new Set(segments.map((segment) => segment.kind));

    expect(kinds).toEqual(
      new Set(["heading", "plain", "emphasis", "link", "directive"])
    );
  });
});
