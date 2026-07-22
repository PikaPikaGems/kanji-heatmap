import type { MarkdownHighlightKind } from "./markdown";

/**
 * Edit-mode syntax colors — change these Tailwind classes to recolor the editor.
 * Japanese words (電車, にほんご, …) use `japanese`.
 * `:vocab[...]{...}` uses `directive`. Markdown links use `link`.
 */
export const EDITOR_HIGHLIGHT_CLASSES: Record<MarkdownHighlightKind, string> = {
  plain: "text-foreground",
  heading: "text-primary",
  emphasis: "text-orange-500",
  link: "text-amber-700 dark:text-amber-400 underline underline-offset-4 decoration-dotted",
  quote: "text-muted-foreground",
  list: "text-violet-700 dark:text-violet-400",
  code: "text-emerald-700 dark:text-emerald-400",
  directive: "text-lime-700 dark:text-lime-400",
  japanese: "text-theme-color-with-opacity-100",
};
