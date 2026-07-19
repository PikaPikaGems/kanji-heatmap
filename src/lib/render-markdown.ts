import { marked } from "marked";

const DOC_LINK_CLASS =
  "underline font-bold hover:bg-[#2effff] hover:text-black rounded-md p-1";

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const isExternalHref = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    link({ href, title, text }) {
      const safeHref = escapeAttr(href);
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
      const externalAttrs = isExternalHref(href)
        ? ' target="_blank" rel="noreferrer"'
        : "";
      return `<a href="${safeHref}"${titleAttr}${externalAttrs} class="${DOC_LINK_CLASS}">${text}</a>`;
    },
  },
});

/** Parse first-party markdown into HTML for docs pages. */
export const renderMarkdown = (markdown: string): string =>
  marked.parse(markdown, { async: false }) as string;
