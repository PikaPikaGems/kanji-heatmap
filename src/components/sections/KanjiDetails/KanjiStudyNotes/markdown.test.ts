import { describe, expect, it, vi } from "vitest";
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

  it("keeps kanji compounds as vocab nodes even when Segmenter sets isWordLike false", () => {
    // Firefox reports isWordLike:false for compounds like 電車 / 自転車.
    const OriginalSegmenter = (
      Intl as typeof Intl & { Segmenter?: typeof Intl.Segmenter }
    ).Segmenter;

    class FirefoxLikeSegmenter {
      segment(input: string) {
        if (OriginalSegmenter == null) {
          return [{ segment: input, isWordLike: false }];
        }
        return [
          ...new OriginalSegmenter("ja", { granularity: "word" }).segment(
            input
          ),
        ].map(({ segment }) => ({ segment, isWordLike: false }));
      }
    }

    vi.stubGlobal("Intl", {
      ...Intl,
      Segmenter: FirefoxLikeSegmenter,
    });

    try {
      expect(
        getVocabNodes("車 (car), 電車 (train), 自転車 (bicycle).").map(
          (node) => node.word
        )
      ).toEqual(["車", "電車", "自転車"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("segments Japanese sentences without requiring spaces", () => {
    const words = getVocabNodes("日本語を勉強する").map((node) => node.word);

    expect(words.length).toBeGreaterThan(1);
    expect(words.join("")).toBe("日本語を勉強する");
  });

  it("keeps pure kana runs as a single vocab node", () => {
    expect(getVocabNodes("にほんご").map((node) => node.word)).toEqual([
      "にほんご",
    ]);
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

  it("highlights Japanese words outside stronger Markdown syntax", () => {
    const segments = getMarkdownHighlightSegments("Ride 電車 and にほんご");
    const japanese = segments
      .filter((segment) => segment.kind === "japanese")
      .map((segment) => segment.text);

    expect(japanese).toEqual(["電車", "にほんご"]);
  });

  it("highlights Japanese inside headings and list items", () => {
    const source = `# My Notes about 車
- 自転車 (bicycle)
## Sidenote about Japanese にほんご`;
    const segments = getMarkdownHighlightSegments(source);
    const japanese = segments
      .filter((segment) => segment.kind === "japanese")
      .map((segment) => segment.text);

    expect(japanese).toEqual(["車", "自転車", "にほんご"]);

    const bicycleLine = segments
      .filter(
        (segment) =>
          segment.text.includes("bicycle") || segment.text === " (bicycle)"
      )
      .map((segment) => segment.kind);

    expect(bicycleLine.every((kind) => kind === "plain")).toBe(true);
  });
});
