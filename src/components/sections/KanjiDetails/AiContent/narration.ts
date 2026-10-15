import { unified } from "unified";
import remarkParse from "remark-parse";
import type { RootContent } from "mdast";

const spokenText = (node: RootContent): string => {
  if (
    node.type === "image" ||
    node.type === "imageReference" ||
    node.type === "definition" ||
    node.type === "html"
  )
    return "";
  if (
    node.type === "text" ||
    node.type === "inlineCode" ||
    node.type === "code"
  ) {
    return node.value.replace(/https?:\/\/\S+/g, "");
  }
  if (node.type === "break") return "\n";
  if ("children" in node) {
    const text = node.children.map(spokenText).join("");
    if (
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "listItem"
    )
      return `${text}\n\n`;
    return text;
  }
  return "";
};

/** Read Japanese and English as written; never send a second AI cleanup request. */
export const prepareNarration = (markdown: string) => {
  const tree = unified().use(remarkParse).parse(markdown);
  return tree.children
    .map(spokenText)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
