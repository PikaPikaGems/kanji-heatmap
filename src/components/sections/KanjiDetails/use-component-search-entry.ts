import { useContext } from "react";
import { ComponentSearchContext } from "./ComponentSearchContext";

export const useComponentSearchEntry = (component: string) => {
  const drawer = useContext(ComponentSearchContext);
  return drawer?.find(([glyph]) => glyph === component) ?? null;
};
