import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./render-markdown";

describe("renderMarkdown", () => {
  it("renders headings and paragraphs", () => {
    const html = renderMarkdown("# About\n\nHello world.");
    expect(html).toContain("<h1>About</h1>");
    expect(html).toContain("<p>Hello world.</p>");
  });

  it("styles external links with target blank", () => {
    const html = renderMarkdown("[Site](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain("underline font-bold");
  });

  it("keeps internal and mailto links in-app", () => {
    const html = renderMarkdown(
      "[Privacy](/privacy) and [mail](mailto:a@b.com)"
    );
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="mailto:a@b.com"');
    expect(html).not.toContain('href="/privacy" target="_blank"');
    expect(html).not.toContain('href="mailto:a@b.com" target="_blank"');
  });
});
