import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { practiceButtonVariants } from "./practice-button-variants";

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
