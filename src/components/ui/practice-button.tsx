import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Duolingo-style practice button: thick bottom edge that “presses in” on click.
 */
const practiceButtonVariants = cva(
  [
    " relative inline-flex items-center justify-center gap-2 select-none",
    "rounded-2xl font-bold tracking-wide",
    "border-2 border-b-[5px]",
    "transition-[transform,border-width,filter] duration-75 ease-out",
    "active:translate-y-[3px] active:border-b-2",
    "disabled:pointer-events-none disabled:opacity-20",
    "disabled:active:translate-y-0 disabled:active:border-b-[5px] disabled:cursor-not-allowed",
    "outline-none [-webkit-tap-highlight-color:transparent]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "background-theme-color-with-opacity-100 text-white border-theme-color-darker hover:brightness-105",
        inverted:
          "bg-foreground text-background border-neutral-800 dark:border-neutral-400 hover:brightness-105",
        danger: "bg-rose-500 text-white border-rose-800 hover:brightness-105",
        secondary:
          "bg-background text-foreground border-foreground/30 hover:bg-accent",
        ghost:
          "bg-transparent text-muted-foreground border-transparent border-b-transparent shadow-none active:translate-y-0 hover:text-foreground",
      },
      size: {
        default: "h-12 px-6 text-base",
        lg: "h-14 w-full px-8 text-lg",
        md: "h-12 w-full px-6 text-base",
        icon: "h-12 w-12 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface PracticeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof practiceButtonVariants> {}

export const PracticeButton = React.forwardRef<
  HTMLButtonElement,
  PracticeButtonProps
>(({ className, variant, size, type = "button", ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(practiceButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
PracticeButton.displayName = "PracticeButton";

export { practiceButtonVariants };
