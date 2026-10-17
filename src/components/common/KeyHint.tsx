import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A button's keyboard shortcut as a tiny muted hint after its label, e.g.
 * "Forgot · ?". Sits inline in the button (vertically centered by the
 * button's flex row) and only shows on fine pointers: touch screens have no
 * keyboard to hint at.
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
      "-ml-1 hidden font-sans text-[9px] font-semibold leading-none opacity-60 pointer-events-none [@media(pointer:fine)]:inline",
      className
    )}
  >
    · {children}
  </kbd>
);
