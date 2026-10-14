import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small keyboard-shortcut badge hanging off a button's top-right corner.
 * The parent must be `relative`. Only shown on fine pointers: touch screens
 * have no keyboard to hint at.
 */
export const KeyHint = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <kbd
    aria-hidden="true"
    className={cn(
      "absolute hidden px-1 text-[10px] font-semibold leading-4 border rounded pointer-events-none -top-2 right-1.5 bg-background text-muted-foreground [@media(pointer:fine)]:block",
      className
    )}
  >
    {children}
  </kbd>
);
