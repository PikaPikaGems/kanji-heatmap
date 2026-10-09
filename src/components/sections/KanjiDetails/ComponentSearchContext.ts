import { createContext } from "react";

export type SphmnDrawer = [
  component: string,
  matches: number,
  strokes: number | null,
][];

export const ComponentSearchContext = createContext<SphmnDrawer | null>(null);
