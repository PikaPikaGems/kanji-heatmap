import { cn } from "@/lib/utils";

export type BlankState = "empty" | "filled" | "current" | "right" | "wrong";

/** Same ring as focused input fields (ui/input.tsx). */
const inputLikeRingCn = "ring-2 ring-ring ring-offset-2 ring-offset-background";

/** The dotted blank's box, shared with the writing games' word prompt. */
export const BLANK_BOX_CN =
  "inline-flex items-center justify-center mx-[0.2em] min-w-[1.45em] h-[1.55em] px-[0.12em] rounded-xl border-[3px] leading-none align-middle";

export const blankCn: Record<BlankState, string> = {
  empty: "border-dotted border-foreground/60 text-muted-foreground",
  filled: "border-dotted border-foreground/40",
  current: cn("border-dotted border-foreground", inputLikeRingCn),
  right:
    "border-dotted border-green-500 bg-green-500/15 animate-practice-correct-pop",
  wrong: "border-dotted border-red-500 bg-red-500/15 animate-practice-shake",
};
