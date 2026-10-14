import type { ExtraProps } from "react-markdown";
import { defaultSchema } from "rehype-sanitize";

/** Keep GitHub-style defaults, plus vocab data-* attrs on spans. */
export const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "data*"],
  },
};

/** A string property of a rendered hast node, tried under each name. */
export const getNodeProperty = (
  node: ExtraProps["node"],
  ...names: string[]
): string | undefined => {
  for (const name of names) {
    const value = node?.properties?.[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
};
