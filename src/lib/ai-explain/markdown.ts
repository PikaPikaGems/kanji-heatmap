/**
 * Grok sometimes wraps headings in bold (`**## Heading**`), which Markdown
 * renders as a bold paragraph showing the "##". Unwrap such lines.
 */
export const normalizeAiMarkdown = (markdown: string) =>
  markdown.replace(/^( {0,3})(\*\*|__)(#{1,6}\s+.*?)\2[ \t]*$/gm, "$1$3");
