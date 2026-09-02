import * as React from "react";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ScrollableDialogContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof DialogContent>,
  "title"
> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  /** Narrow modal (settings, writing practice). Default is full dialog width. */
  size?: "md" | "default";
  /**
   * When false, the body is a flex slot only; children own scrolling
   * (e.g. Sort and Filter form with a sticky footer).
   */
  scrollBody?: boolean;
};

export const ScrollableDialogContent = ({
  title,
  description,
  children,
  className,
  headerClassName,
  titleClassName,
  bodyClassName,
  size = "default",
  scrollBody = true,
  ...props
}: ScrollableDialogContentProps) => (
  <DialogContent
    className={cn(
      "flex max-h-[96dvh] min-h-0 flex-col gap-0 overflow-hidden px-0 py-0",
      size === "md" && "max-w-md",
      className
    )}
    {...props}
  >
    <DialogHeader className={cn("shrink-0 px-6 pt-4 pb-2", headerClassName)}>
      <DialogTitle className={cn("m-0", titleClassName)}>{title}</DialogTitle>
      {description != null && (
        <DialogDescription className="sr-only">{description}</DialogDescription>
      )}
    </DialogHeader>
    <div
      className={cn(
        scrollBody
          ? "min-h-0 flex-1 overflow-y-auto px-4 pb-6"
          : "flex min-h-0 flex-1 flex-col",
        bodyClassName
      )}
    >
      {children}
    </div>
  </DialogContent>
);
