import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** A plain textarea styled like the kanji drawer's study notes editor. */
export const StudyNotesTextarea = ({
  className,
  ...props
}: ComponentProps<"textarea">) => (
  <textarea
    {...props}
    className={cn(
      "block w-full resize-none rounded-xl border-[3px] border-dotted border-border bg-background p-3.5 font-mono text-base leading-[1.55rem] whitespace-pre-wrap break-words outline-none focus:border-ring focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring",
      className
    )}
  />
);
